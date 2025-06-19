// server.js (for the Backend Repository)
require("dotenv").config(); // Keep this for environment variables

const {createServer} = require("http");
const {Server} = require("socket.io");
const Papa = require("papaparse"); // Used for parsing CSV data
const {GoogleGenerativeAI} = require("@google/generative-ai");
const pdfParse = require("pdf-parse");
const {default: fetch} = require("node-fetch");
const {v4: uuidv4} = require("uuid"); // Used for unique IDs

// --- Configuration ---
// Listen on all available network interfaces
// Most hosting providers will set the PORT environment variable.
const hostname = "0.0.0.0";
// const hostname = "localhost";
const port = process.env.PORT || 5000;

// Initialize Gemini API
const geminiApiKey = process.env.GEMINI_API_KEY;
if (!geminiApiKey) {
    console.error(
        "GEMINI_API_KEY environment variable is not set. Gemini functions will not work.",
        geminiApiKey
    );
    process.exit(1);
}
const genAI = geminiApiKey ? new GoogleGenerativeAI(geminiApiKey) : null;
const model = genAI
    ? genAI.getGenerativeModel({model: "gemini-2.5-flash"}) // Using text-only model as image fallback is removed
    : null;

// --- Helper Functions (Your "Backend Functions") ---

async function extractPdfData(resume_link) {
    if (!resume_link) {
        console.warn("PDF URL is empty, skipping extraction.");
        return {text: null};
    }
    console.log(`Attempting to fetch PDF from: ${resume_link}`);

    let pdfBuffer;
    let effectiveResumeLink = resume_link;

    const googleDriveRegex =
        /(?:https?:\/\/(?:www\.)?drive\.google\.com\/(?:file\/d\/|open\?id=))([a-zA-Z0-9_-]+)/;
    const match = resume_link.match(googleDriveRegex);

    if (match && match[1]) {
        const fileId = match[1];
        effectiveResumeLink = `https://drive.google.com/uc?export=download&id=${fileId}`;
        console.log(
            `Converted Google Drive link to direct download: ${effectiveResumeLink}`
        );
    } else {
        console.warn(
            `Could not extract Google Drive file ID from link: ${resume_link}. Attempting to fetch original link.`
        );
    }

    try {
        const response = await fetch(effectiveResumeLink, {timeout: 10000});
        if (!response.ok) {
            console.error(
                `Failed to fetch PDF from ${effectiveResumeLink}: ${response.status} ${response.statusText}`
            );
            return {text: null};
        }
        pdfBuffer = await response.arrayBuffer();
    } catch (error) {
        console.error(`Error fetching PDF from ${effectiveResumeLink}:`, error);
        return {text: null};
    }

    let extractedText = null;
    try {
        const data = await pdfParse(pdfBuffer);
        extractedText = data.text;
        if (extractedText && extractedText.trim().length > 0) {
            console.log(
                `Successfully extracted text from PDF using pdf-parse: ${effectiveResumeLink.substring(
                    0,
                    50
                )}...`
            );
            return {text: extractedText};
        } else {
            console.warn(
                `pdf-parse extracted no meaningful text from ${effectiveResumeLink}.`
            );
            return {text: null};
        }
    } catch (error) {
        console.error(
            `Error extracting PDF text with pdf-parse from ${effectiveResumeLink}:`,
            error.message
        );
        return {text: null};
    }
}

async function compareWithLLM(resumeContent, jobDescription) {
    if (!model) {
        console.error("Gemini model not initialized. Skipping LLM comparison.");
        return {rating: 0, summary: "LLM not configured."};
    }

    if (!resumeContent || !resumeContent.text) {
        return {
            rating: 0,
            summary: "Missing resume content for LLM analysis.",
        };
    }

    const prompt = [
        {
            text: `Analyze the following resume content against the job description.
            Provide a numeric rating from 0 to 10 (where 0 is no match, 10 is perfect match) indicating how well the resume matches the job description.
            Also, provide a single-line summarized report explaining your rating.
            Output format:"Rating:1/10 Summary:lorem ipsum"

            Resume Content:
            ${
                resumeContent.text.length > 8000
                    ? resumeContent.text.substring(0, 8000) +
                      "\n... (truncated)"
                    : resumeContent.text
            }

            Job Description:
            ${
                jobDescription.length > 8000
                    ? jobDescription.substring(0, 8000) + "\n... (truncated)"
                    : jobDescription
            }
        `,
        },
    ];

    try {
        console.log("Calling Gemini LLM for comparison...");
        const result = await model.generateContent({
            contents: [{parts: prompt}],
        });
        const response = await result.response;
        const text = response.text();
        console.log("Gemini LLM response received:", text);

        const ratingMatch = text.match(
            /(?:Numeric )?Rating:\s*\*?(\d+)(?:\/\d+)?/i
        );
        const summaryMatch = text.match(
            /(?:Summarized Report|Summary):\s*(.*)/i
        );

        let rating = 0;
        if (ratingMatch && ratingMatch[1]) {
            rating = parseInt(ratingMatch[1], 10);
            if (isNaN(rating) || rating < 0 || rating > 10) {
                rating = 0;
                console.warn(
                    `Parsed rating '${ratingMatch[1]}' is invalid. Defaulting to 0.`
                );
            }
        } else {
            console.warn(
                "Could not find a valid integer rating in LLM response."
            );
        }

        const summary = summaryMatch
            ? summaryMatch[1].trim()
            : "Could not parse summary from LLM response.";

        return {rating, summary};
    } catch (error) {
        console.error("Error calling Gemini LLM:", error);
        return {
            rating: 0,
            summary: "Failed to get LLM report due to API error.",
        };
    }
}

// Create a standard Node.js HTTP server.
// This server will primarily host your Socket.IO connection.
const httpServer = createServer((req, res) => {
    // For a pure backend, you might just return a simple message for HTTP requests
    // to the root URL, as the main interaction will be via WebSockets.
    res.writeHead(200, {"Content-Type": "text/plain"});
    res.end(
        "Backend server is running. WebSocket (Socket.IO) endpoint available."
    );
});

// Attach Socket.IO server to the HTTP server
const io = new Server(httpServer, {
    cors: {
        // IMPORTANT: In production, change this from "*" to your Vercel frontend URL!
        // e.g., origin: "https://your-frontend-app.vercel.app",
        origin: "*",
        methods: ["GET", "POST"],
    },
    maxHttpBufferSize: 1e8,
});

io.on("connection", (socket) => {
    console.log(`Socket.IO client connected: ${socket.id}`);

    socket.on("startProcessing", async ({csvData, txtData}) => {
        console.log(`Processing started for client: ${socket.id}`);

        socket.emit("processingUpdate", {
            status: "analysing all resume",
            report: "Received data. Initializing analysis process...",
        });

        const processedResumes = [];
        let successfulExtractions = 0;
        let successfulLLMCalls = 0;

        try {
            for (let i = 0; i < csvData.length; i++) {
                const row = csvData[i];
                const email = row.email || `NoEmail_${i}`;
                const resume_link = row.resume_link;

                socket.emit("processingUpdate", {
                    report: `Processing resume ${i + 1}/${
                        csvData.length
                    } (Email: ${email})...`,
                });

                let extractedContent = {text: null};
                if (resume_link) {
                    socket.emit("processingUpdate", {
                        report: `Extracting PDF from URL for ${email}...`,
                    });
                    extractedContent = await extractPdfData(resume_link);
                    if (extractedContent.text) {
                        successfulExtractions++;
                    } else {
                        console.warn(
                            `Could not extract text content from PDF for ${email}.`
                        );
                    }
                } else {
                    console.warn(
                        `No PDF URL found for ${email}. Skipping PDF extraction.`
                    );
                    socket.emit("processingUpdate", {
                        report: `No PDF URL for ${email}. Skipping PDF extraction.`,
                    });
                }

                let llmRating = 0;
                let llmSummary = "Resume content not analyzed.";
                if (extractedContent.text) {
                    socket.emit("processingUpdate", {
                        report: `Analyzing resume ${email} with Gemini LLM...`,
                    });
                    const llmReport = await compareWithLLM(
                        extractedContent,
                        txtData
                    );
                    llmRating = llmReport.rating;
                    llmSummary = llmReport.summary;
                    if (
                        llmReport.rating > 0 ||
                        llmReport.summary !== "LLM not configured."
                    ) {
                        successfulLLMCalls++;
                    }
                } else {
                    llmSummary =
                        "LLM analysis skipped due to no extracted PDF text.";
                }

                const processedRow = {
                    ...row,
                    pdfExtractionStatus: extractedContent.text
                        ? "Success"
                        : "Failed",
                    Rating: llmRating,
                    Summary: llmSummary,
                };
                processedResumes.push(processedRow);

                console.log(
                    `Completed processing for ${email}. Rating: ${llmRating}`
                );
            }

            socket.emit("processingUpdate", {
                status: "converting to csv",
                report: "All resumes processed. Generating final CSV...",
            });

            socket.emit("processingComplete", {
                finalData: processedResumes,
                report: `Successfully extracted text from ${successfulExtractions} PDFs and ran ${successfulLLMCalls} LLM analyses.`,
            });
            console.log(
                `Processing complete and final data sent to client: ${socket.id}`
            );
        } catch (error) {
            console.error(
                `Error during processing for client ${socket.id}:`,
                error
            );
            socket.emit("processingError", {
                message:
                    "An error occurred during backend processing. Check server logs.",
                error: error.message,
            });
        }
    });

    socket.on("disconnect", () => {
        console.log(`Socket.IO client disconnected: ${socket.id}`);
    });
});

// Start the HTTP server
httpServer.listen(port, hostname, (err) => {
    if (err) throw err;
    console.log(
        `> Backend Socket.IO server ready on http://${hostname}:${port}`
    );
});
