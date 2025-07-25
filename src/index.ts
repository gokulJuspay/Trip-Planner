import { createBestAIProvider, createAIProvider } from "@juspay/neurolink";
import * as readlineSync from 'readline-sync';
import * as fs from 'fs';
import { BraveSearch } from 'brave-search';
import axios from 'axios';
import * as dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';

dotenv.config();

const promptTemplate = `
You are an intelligent travel assistant helping users plan personalized, optimized, and realistic daily travel itineraries. The user will provide their destination, travel dates, trip type, and preferences. Based on that, you will generate a full-day-by-day itinerary that includes:

- Top attractions (famous + hidden gems)
- Local restaurants (based on taste or diet)
- Events/festivals happening during that time (if any)
- Breaks, buffer time, and transit duration
- Local cultural tips or fun facts (1 per day)
- A packing tip or weather advice based on forecast
- Flight details from the real-time information
- respond in plain text only. Your entire response must be plain text, with no markdown formatting such as headers, bolding, or lists.

## User Info:
- Destination: {{destination}}
- Dates: {{start_date}} to {{end_date}}
- Type of Trip: {{trip_type}} (e.g., business, leisure, adventure, food tour, cultural, solo, couple, family)
- Interests: {{interests}} (e.g., art, food, architecture, nightlife, hiking, nature, relaxation, photography)
- Budget: {{budget}} (e.g., budget, mid-range, luxury)
- Travel pace: {{pace}} (e.g., relaxed, medium, packed)
- Extra Notes: {{extra_notes}}

## Instructions:
1. Divide the trip into clear Day 1, Day 2... sections.
2. Each day should include:
   - Morning activity
   - Lunch place (with cuisine suggestion)
   - Afternoon activity
   - Optional evening plan or rest idea
3. Mention entry fees, travel time, local customs briefly if relevant.
4. Try to maximize unique experiences, not just common tourist spots.
5. Include 1 line of travel wisdom or tip each day.

Your entire response must be in plain text. Do not use any markdown.
`;

async function getFlightData(fromId: string, toId: string, departDate: string, returnDate: string): Promise<string> {
    
    
    const options = {
        method: 'GET',
        url: 'https://booking-com15.p.rapidapi.com/api/v1/flights/searchFlights',
        params: {
            fromId: fromId,
            toId: toId,
            departDate: departDate,
            returnDate: returnDate,
            stops: 'none',
            pageNo: '1',
            adults: '1',
            children: '0,17',
            sort: 'BEST',
            cabinClass: 'ECONOMY',
            currency_code: 'AED'
        },
        headers: {
            'x-rapidapi-host': 'booking-com15.p.rapidapi.com',
            'x-rapidapi-key': process.env.RAPIDAPI_KEY || ''
        }
    };

    try {
        // console.log("Flight Data Request:", JSON.stringify(options, null, 2));
        const response = await axios.request(options);
        return JSON.stringify(response.data);
    } catch (error: any) {
        if (error.response) {
            // The request was made and the server responded with a status code
            // that falls out of the range of 2xx
            console.error("Error fetching flight data:", error.response.data);
            return `Error fetching flight data: ${error.response.status} ${error.response.statusText}`;
        } else if (error.request) {
            // The request was made but no response was received
            console.error("Error fetching flight data: No response received");
            return "Error fetching flight data: No response received";
        } else {
            // Something happened in setting up the request that triggered an Error
            console.error('Error', error.message);
            return `Error fetching flight data: ${error.message}`;
        }
    }
}

async function searchRealTimeInfo(query: string): Promise<string> {
    try {
        const brave = new BraveSearch(process.env.BRAVE_API_KEY || '');
        const searchResults = await brave.webSearch(query);
        if (searchResults && searchResults.web && searchResults.web.results) {
            return searchResults.web.results.map((r: any) => r.description).join('\n');
        }
    } catch (error: any) {
        if (error.message && error.message.includes('422')) {
            return `Could not find real-time information for the provided location.`;
        }
        console.error(`Error fetching real-time info for query "${query}":`, error);
    }
    return '';
}

interface UserInfo {
    destination: string;
    start_date: string;
    end_date: string;
    trip_type: string;
    interests: string;
    budget: string;
    pace: string;
    extra_notes: string;
}

function formatPrompt(userInfo: UserInfo): string {
    let prompt = promptTemplate;
    for (const key in userInfo) {
        prompt = prompt.replace(`{{${key}}}`, userInfo[key as keyof UserInfo]);
    }
    return prompt;
}

async function main() {
    // console.log(process.env.BRAVE_API_KEY);
    // console.log(process.env.RAPIDAPI_KEY);
    let destination = '';
    while (destination.length < 4) {
        destination = readlineSync.question('Enter your destination (at least 4 characters): ');
        if (destination.length < 4) {
            console.log("Destination is too short. Please enter a more specific location.");
        }
    }

    const fromId = readlineSync.question('Enter the source airport IATA code for your flight (e.g., BOM.AIRPORT): ');
    const toId = readlineSync.question('Enter the destination airport IATA code for your flight (e.g., DEL.AIRPORT): ');
    const departDate = readlineSync.question('Enter the departure date (YYYY-MM-DD): ');
    const returnDate = readlineSync.question('Enter the return date (YYYY-MM-DD): ');

    const userInfo: UserInfo = {
        destination: destination,
        start_date: departDate,
        end_date: returnDate,
        trip_type: readlineSync.question('Enter the type of trip (e.g., business, leisure, adventure): '),
        interests: readlineSync.question('Enter your interests (e.g., art, food, hiking): '),
        budget: readlineSync.question('Enter your budget (e.g., budget, mid-range, luxury): '),
        pace: readlineSync.question('Enter your travel pace (e.g., relaxed, medium, packed): '),
        extra_notes: readlineSync.question('Enter any extra notes: '),
    };

    const searchQueries = [
        `events and festivals in ${userInfo.destination}`,
        `weather forecast for ${userInfo.destination}`
    ];

    let realTimeInfo = '';
    for (const query of searchQueries) {
        realTimeInfo += await searchRealTimeInfo(query) + '\n';
    }

    const flightData = await getFlightData(fromId, toId, departDate, returnDate);
    realTimeInfo += `\n\n## Flight Information:\n${flightData}`;

    const prompt = formatPrompt(userInfo) + "\n\n## Real-time Information:\n" + realTimeInfo;

    // Use Google AI directly as a fallback
    if (process.env.GOOGLE_AI_API_KEY) {
        console.log("Using Google AI directly...");
        try {
            const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY);
            const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
            
            const result = await model.generateContentStream(prompt);
            
            let fullText = "";
            for await (const chunk of result.stream) {
                const chunkText = chunk.text();
                fullText += chunkText;
                process.stdout.write(chunkText);
            }
            
            fs.writeFileSync('output.txt', fullText);
            console.log("\n\nItinerary also written to output.txt");
        } catch (error: any) {
            console.error("\n❌ Failed to generate content with Google AI!");
            console.error("Error:", error.message);
            if (error.message.includes('API_KEY_INVALID')) {
                console.log("\n⚠️  Your Google AI API key appears to be invalid.");
                console.log("Please check your key at: https://aistudio.google.com/apikey");
            }
        }
    } else {
        // Try neurolink providers
        let provider;
        try {
            console.log("Detecting available AI providers...");
            provider = await createBestAIProvider();
            console.log("✅ Successfully initialized AI provider");
            
            const result = await provider.stream({
                input: { text: prompt },
                timeout: "120s",
            });

            if (result) {
                let fullText = "";
                for await (const chunk of result.stream) {
                    fullText += chunk.content;
                    process.stdout.write(chunk.content);
                }

                fs.writeFileSync('output.txt', fullText);
                console.log("\n\nItinerary also written to output.txt");
            }
        } catch (error: any) {
            console.error("\n❌ Failed to initialize AI provider!");
            console.error("Error details:", error.message);
            console.log("\n📋 To use this application, you need to configure at least one AI provider:");
            console.log("\n1. OpenAI (Paid):");
            console.log("   - Get API key from: https://platform.openai.com/api-keys");
            console.log("   - Set OPENAI_API_KEY in your .env file");
            console.log("\n2. Google AI Studio (Free tier available):");
            console.log("   - Get API key from: https://aistudio.google.com/apikey");
            console.log("   - Set GOOGLE_AI_API_KEY in your .env file");
            console.log("\n3. Ollama (Free, runs locally):");
            console.log("   - Install from: https://ollama.com");
            console.log("   - Run: ollama pull llama3.2");
            console.log("   - No API key needed");
            console.log("\n4. Anthropic Claude (Paid):");
            console.log("   - Get API key from: https://console.anthropic.com");
            console.log("   - Set ANTHROPIC_API_KEY in your .env file");
            console.log("\n✅ After setting up a provider, run this application again.");
        }
    }
}

main().catch(console.error);
