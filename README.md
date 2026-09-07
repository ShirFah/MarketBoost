# Insight Stream

Add real-time web search to the existing Market Analysis and Opportunity Detection features.

Goal:
The current AI outputs rely only on the user's business profile and the model's training knowledge. I want Market Analysis and Opportunity Detection to use current web information so competitor, trend, market, and opportunity insights reflect real and recent data.

Implementation requirements:

Keep the existing UI and current user flow unchanged unless a small UI adjustment is necessary.

Update these existing generators:

generateMarketAnalysis

generateOpportunities

Use Claude through a secure server-side function.

Enable Claude's server-side web search capability for these two generators.

Never expose the Anthropic API key in the frontend.
Store and access the API key only through secure environment variables / secrets.

For Market Analysis, Claude should research current information such as:

Relevant competitors

Current market trends

Customer behavior

Industry developments

Competitor positioning

Pricing or offers when publicly available

Important recent changes in the market

For Opportunity Detection, Claude should research current information such as:

Emerging trends

Competitor weaknesses or gaps

Underserved customer needs

New content opportunities

New marketing channels or formats

Market gaps

Timely opportunities relevant to the business

Combine:

the user's business profile

existing app data

current web search findings

before generating the final analysis.

Make the output specific to the user's business. Avoid generic marketing advice.

Prefer recent and credible sources.

Include source information in the result whenever possible, such as:

source name

page/article title

URL

publication date when available

Clearly distinguish between:

information found from current web research

AI interpretation/recommendations

Add graceful fallback behavior:
If web search fails or returns insufficient information, the generator should still return a useful AI-generated result based on the business profile, but clearly indicate that live market data was unavailable.

Add loading and error handling without breaking the existing experience.

Do not modify unrelated features, database structure, authentication, design system, routing, or existing functionality.

Before making changes:
Inspect the existing project structure and reuse the current architecture and patterns wherever possible.

After implementation:
Verify that both generateMarketAnalysis and generateOpportunities actually use live web data and that the sources are returned correctly.

Do not rebuild these features from scratch if they already exist. Extend the existing implementation.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/49583220-13b9-436d-b755-12c5c2df165b).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
