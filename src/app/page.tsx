"use client"; // Mark as a Client Component

import { useState } from "react";
import ReactMarkdown from "react-markdown";

// Define the expected structure of a diff object
interface DiffItem {
  id: string;
  description: string;
  diff: string;
  url: string; // Added URL field
}

// Define the expected structure of the API response
interface ApiResponse {
  diffs: DiffItem[];
  nextPage: number | null;
  currentPage: number;
  perPage: number;
}

export default function Home() {
  const [diffs, setDiffs] = useState<DiffItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [nextPage, setNextPage] = useState<number | null>(null);
  const [initialFetchDone, setInitialFetchDone] = useState<boolean>(false);
  const [notesLoadingId, setNotesLoadingId] = useState<string | null>(null);
  const [notesContent, setNotesContent] = useState<{ [key: string]: string }>({});

  const fetchDiffs = async (page: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/sample-diffs?page=${page}&per_page=10`
      );
      if (!response.ok) {
        let errorMsg = `HTTP error! status: ${response.status}`;
        try {
          const errorData = await response.json();
          errorMsg = errorData.error || errorData.details || errorMsg;
        } catch {
          // Ignore if response body is not JSON
          console.warn("Failed to parse error response as JSON");
        }
        throw new Error(errorMsg);
      }
      const data: ApiResponse = await response.json();

      setDiffs((prevDiffs) =>
        page === 1 ? data.diffs : [...prevDiffs, ...data.diffs]
      );
      setCurrentPage(data.currentPage);
      setNextPage(data.nextPage);
      if (!initialFetchDone) setInitialFetchDone(true);
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "An unknown error occurred"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleFetchClick = () => {
    setDiffs([]); // Clear existing diffs when fetching the first page again
    fetchDiffs(1);
  };

  const handleLoadMoreClick = () => {
    if (nextPage) {
      fetchDiffs(nextPage);
    }
  };

  const handleNotes = async (item: DiffItem) => { // Generate notes for the selected diff
    if (notesLoadingId === item.id) return; // Prevent re-triggering if already loading
    setNotesLoadingId(item.id);
    setNotesContent((prev) => ({ ...prev, [item.id]: "" }));
    try {
      const res = await fetch("/api/generate-notes", { // Generate notes/call
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ diff: item.diff }),
      });

      if (!res.ok || !res.body) { // Check for errors
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let fullText = ""; 

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        // console.log("whole chunk:", chunk); // Debugging line
        fullText += chunk;
        setNotesContent((prev) => ({
          ...prev,
          [item.id]: fullText,
        }));
      }
      // console.log("Final notes:", fullText); // Debugging line
    } catch (err) {
      console.error("failed here:", err); // Debugging line
      setNotesContent((prev) => ({
        ...prev,
        [item.id]: "Failed to generate notes.", 
      }));
    } finally {
      setNotesLoadingId(null);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center p-12 sm:p-24">
      <h1 className="text-4xl font-bold mb-12">Diff Digest ✍️</h1>

      <div className="w-full max-w-4xl">
        {/* Controls Section */}
        <div className="mb-8 flex space-x-4">
          <button
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors disabled:opacity-50"
            onClick={handleFetchClick}
            disabled={isLoading}
          >
            {isLoading && currentPage === 1
              ? "Fetching..."
              : "Fetch Latest Diffs"}
          </button>
        </div>

        {/* Results Section */}
        <div className="border border-gray-300 dark:border-gray-700 rounded-lg p-6 min-h-[300px] bg-gray-50 dark:bg-gray-800">
          <h2 className="text-2xl font-semibold mb-4">Merged Pull Requests</h2>

          {error && (
            <div className="text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30 p-3 rounded mb-4">
              Error: {error}
            </div>
          )}

          {!initialFetchDone && !isLoading && (
            <p className="text-gray-600 dark:text-gray-400">
              Click the button above to fetch the latest merged pull requests
              from the repository.
            </p>
          )}

          {initialFetchDone && diffs.length === 0 && !isLoading && !error && (
            <p className="text-gray-600 dark:text-gray-400">
              No merged pull requests found or fetched.
            </p>
          )}

          {diffs.length > 0 && (
            <ul className="space-y-3 list-disc list-inside">
              {diffs.map((item) => (
                <li key={item.id} className="group flex flex-col text-gray-800 dark:text-gray-200 space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:space-x-2">
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      PR #{item.id}:
                    </a>
                    <span>{item.description}</span>
                    <button
                      onClick={() => handleNotes(item)}
                      className="text-sm text-green-600 hover:text-green-800 underline transition sm:invisible group-hover:sm:visible"
                      disabled={notesLoadingId === item.id}
                    >
                      {notesLoadingId === item.id
                        ? "Generating..."
                        : notesContent[item.id]
                        ? "Re-generate Notes"
                        : "Generate Notes"}
                    </button>
                  </div>

                  {notesContent[item.id] && (
                    <article className="prose prose-sm dark:prose-invert max-w-none bg-gray-100 dark:bg-gray-700 p-4 rounded-lg overflow-auto">
                      <ReactMarkdown>{notesContent[item.id]}</ReactMarkdown>
                    </article>
                  )}
                </li>
              ))}
            </ul>
          )}

          {isLoading && currentPage > 1 && (
            <p className="text-gray-600 dark:text-gray-400 mt-4">
              Loading more...
            </p>
          )}

          {nextPage && !isLoading && (
            <div className="mt-6">
              <button
                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors disabled:opacity-50"
                onClick={handleLoadMoreClick}
                disabled={isLoading}
              >
                Load More (Page {nextPage})
              </button>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
