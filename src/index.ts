import { createBestAIProvider } from "@juspay/neurolink";
import * as readlineSync from 'readline-sync';
import * as fs from 'fs';

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
    const userInfo: UserInfo = {
        destination: readlineSync.question('Enter your destination: '),
        start_date: readlineSync.question('Enter the start date (YYYY-MM-DD): '),
        end_date: readlineSync.question('Enter the end date (YYYY-MM-DD): '),
        trip_type: readlineSync.question('Enter the type of trip (e.g., business, leisure, adventure): '),
        interests: readlineSync.question('Enter your interests (e.g., art, food, hiking): '),
        budget: readlineSync.question('Enter your budget (e.g., budget, mid-range, luxury): '),
        pace: readlineSync.question('Enter your travel pace (e.g., relaxed, medium, packed): '),
        extra_notes: readlineSync.question('Enter any extra notes: '),
    };

    const prompt = formatPrompt(userInfo);

    // Auto-selects best available provider
    const provider = await createBestAIProvider();
    const result = await provider.generateText({
        prompt: prompt,
        timeout: "120s", // Optional: Set custom timeout (default: 30s)
    });

    if (result) {
        fs.writeFileSync('output.txt', result.text);
        console.log(result.text);
        console.log("\nItinerary also written to output.txt");
    }
}

main().catch(console.error);
