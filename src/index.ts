import { createBestAIProvider } from "@juspay/neurolink";
import * as readlineSync from 'readline-sync';
import * as fs from 'fs';
import { BraveSearch } from 'brave-search';
import axios from 'axios';

const promptTemplate = `
You are an intelligent travel assistant helping users plan personalized, optimized, and realistic daily travel itineraries. The user will provide their destination, travel dates, trip type, and preferences. Based on that, you will generate a full-day-by-day itinerary that includes:

- Top attractions (famous + hidden gems)
- Local restaurants (based on taste or diet)
- Events/festivals happening during that time (if any)
- Breaks, buffer time, and transit duration
- Local cultural tips or fun facts (1 per day)
- A packing tip or weather advice based on forecast
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

async function getFlightData(source: string, destination: string): Promise<string> {
    const options = {
        method: 'GET',
        url: 'https://flight-data-aggregator.p.rapidapi.com/search',
        params: {
            'source-iata': source,
            'destination-iata': destination,
            'date': '2025-09-01',
            'pax': '1'
        },
        headers: {
            'X-RapidAPI-Key': process.env.RAPIDAPI_KEY || '',
            'X-RapidAPI-Host': 'flight-data-aggregator.p.rapidapi.com'
        }
    };

    try {
        const response = await axios.request(options);
        return JSON.stringify(response.data);
    } catch (error) {
        console.error("Error fetching flight data:", error);
        return '';
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
    let destination = '';
    while (destination.length < 4) {
        destination = readlineSync.question('Enter your destination (at least 4 characters): ');
        if (destination.length < 4) {
            console.log("Destination is too short. Please enter a more specific location.");
        }
    }

    const source = readlineSync.question('Enter the source airport IATA code for your flight: ');
    const destinationForFlight = readlineSync.question('Enter the destination airport IATA code for your flight: ');

    const userInfo: UserInfo = {
        destination: destination,
        start_date: readlineSync.question('Enter the start date (YYYY-MM-DD): '),
        end_date: readlineSync.question('Enter the end date (YYYY-MM-DD): '),
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

    const flightData = await getFlightData(source, destinationForFlight);
    realTimeInfo += `\n\n## Flight Information:\n${flightData}`;

    const prompt = formatPrompt(userInfo) + "\n\n## Real-time Information:\n" + realTimeInfo;

    // Auto-selects best available provider
    const provider = await createBestAIProvider();
    const result = await provider.streamText({
        prompt: prompt,
        timeout: "120s", // Optional: Set custom timeout (default: 30s)
    });

    if (result) {
        let fullText = "";
        for await (const chunk of result.textStream) {
            fullText += chunk;
            process.stdout.write(chunk);
        }

        fs.writeFileSync('output.txt', fullText);
        console.log("\n\nItinerary also written to output.txt");
    }
}

main().catch(console.error);
