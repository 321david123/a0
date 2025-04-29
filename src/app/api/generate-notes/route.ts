import { NextRequest } from 'next/server';
import { openai } from '@ai-sdk/openai';
import { streamText } from 'ai';

export const runtime = 'edge'; // vercel faster servers

export async function POST(req: NextRequest) {
    const { diff } = await req.json();

    if (!diff) {
        return new Response(JSON.stringify({ error: 'Missing diff content.' }), { status: 400 });
    }

    const { textStream } = await streamText({
        model: openai('gpt-4o-mini'),
        system: "You are generating developer and marketing release notes based on Git diffs.",
        messages: [
            {
                role: "user",
                content: `
You will receive a diff from a git repository. Your mission is to generate two types of release notes based on the diff.
The first one is for developers, and the second one is for marketing.
(don't forget to resalt the titles developer notes and marketing notes over the text.) (if the pr is extremely big or small just reply that)
Developer Notes: technical, should be concise, technical, and focus on the _what_ and _why_ of the changes (e.g., "Refactored useFetchDiffs hook to use useSWR for improved caching and reduced re-renders.").
Marketing Notes: 2–3 bullet points, user-centric, highlight the _benefit_ of the change/improvements, use simpler language (e.g., "Loading pull requests is now faster and smoother thanks to improved data fetching!").
Git diff:
---
${diff}
---
`
            }
        ],
        temperature: 0.2,
    });
    console.log(textStream)
    const reader = textStream.getReader();
    const stream = new ReadableStream({
        async pull(controller) {
            const { done, value } = await reader.read();
            if (done) {
                controller.close();
            } else {
                controller.enqueue(new TextEncoder().encode(value));
            }
        }
    });

    return new Response(stream, {
        headers: { 'Content-Type': 'text/plain; charset=utf-8' }
    });
}