# Trip Planner

This is a simple command-line application that generates a personalized travel itinerary using the power of AI. It uses the `@juspay/neurolink` SDK to connect to various AI providers and generate a detailed, day-by-day travel plan based on user input.

## Features

-   **Personalized Itineraries:** Get a travel plan tailored to your destination, dates, interests, and budget.
-   **Powered by Neurolink:** Leverages the `@juspay/neurolink` SDK to seamlessly connect with multiple AI providers.
-   **Interactive CLI:** Prompts the user for all the necessary information to create the itinerary.
-   **File Output:** Saves the generated itinerary to an `output.txt` file for easy access.

## Demo

Check out a video of the trip planner in action: [Trip Planner Demo](https://drive.google.com/file/d/17fU4uctF78IJ1gdalCkMcW4jnONKmERN/view?usp=sharing)

## Getting Started

### Prerequisites

-   Node.js and npm installed on your machine.
-   An API key from an AI provider supported by Neurolink (e.g., OpenAI, Google AI).

### Installation

1.  Clone the repository:
    ```bash
    git clone https://github.com/gokulJuspay/Trip-Planner.git
    ```
2.  Navigate to the project directory:
    ```bash
    cd Trip-Planner
    ```
3.  Install the dependencies:
    ```bash
    npm install
    ```

### Configuration

1.  Create a `.env` file in the root of the project by copying the `.env.example` file:
    ```bash
    cp .env.example .env
    ```
2.  Add your AI provider's API key, your Brave Search API key, and your RapidAPI key to the `.env` file. For example:
    ```
    OPENAI_API_KEY="sk-your-openai-key"
    BRAVE_API_KEY="your-brave-api-key"
    RAPIDAPI_KEY="your-rapidapi-key"
    ```

### Usage

1.  Run the application:
    ```bash
    npm start
    ```
2.  Follow the prompts to enter your travel details.
3.  Once the itinerary is generated, it will be displayed in the console and saved to `output.txt`.

## How It Works

The application uses a detailed prompt template that is filled with the user's input. This prompt is then sent to the AI provider using the `@juspay/neurolink` SDK. The SDK automatically selects the best available provider to handle the request. The generated text is then displayed to the user and saved to a file.
