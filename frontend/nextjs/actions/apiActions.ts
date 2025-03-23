import { createParser, type EventSourceMessage } from "eventsource-parser";

interface ParsedEvent {
  type: 'event';
  data: string;
}

interface ReconnectInterval {
  type: 'reconnect-interval';
}

function isParseEvent(event: ParsedEvent | ReconnectInterval): event is ParsedEvent {
  return event.type === 'event';
}

export async function handleSourcesAndAnswer(question: string) {
  let sourcesResponse = await fetch("/api/getSources", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ question }),
  });
  let sources = await sourcesResponse.json();

  const response = await fetch("/api/getAnswer", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ question, sources }),
  });

  if (!response.ok) {
    throw new Error(response.statusText);
  }

  if (response.status === 202) {
    const fullAnswer = await response.text();
    return fullAnswer;
  }

  // This data is a ReadableStream
  const data = response.body;
  if (!data) {
    return;
  }

  const onParse = {
    onEvent(event: EventSourceMessage) {
      try {
        const text = JSON.parse(event.data).text ?? "";
        return text;
      } catch (e) {
        console.error("Error parsing JSON:", e);
        return "";
      }
    }
  };

  const reader = data.getReader();
  const decoder = new TextDecoder();
  const parser = createParser(onParse);
  
  let done = false;
  while (!done) {
    const { value, done: doneReading } = await reader.read();
    done = doneReading;
    if (value) {
      const chunkValue = decoder.decode(value);
      parser.feed(chunkValue);
    }
  }
}

export async function handleSimilarQuestions(question: string) {
  let res = await fetch("/api/getSimilarQuestions", {
    method: "POST",
    body: JSON.stringify({ question }),
  });
  let questions = await res.json();
  return questions;
}

export async function handleLanggraphAnswer(question: string) {
  const response = await fetch("/api/generateLanggraph", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ question }),
  });

  if (!response.ok) {
    throw new Error(response.statusText);
  }

  // This data is a ReadableStream
  const data = response.body;
  if (!data) {
    return;
  }

  const onParse = {
    onEvent(event: EventSourceMessage) {
      try {
        const text = JSON.parse(event.data).text ?? "";
        return text;
      } catch (e) {
        console.error("Error parsing JSON:", e);
        return "";
      }
    }
  };

  const reader = data.getReader();
  const decoder = new TextDecoder();
  const parser = createParser(onParse);
  
  let done = false;
  while (!done) {
    const { value, done: doneReading } = await reader.read();
    done = doneReading;
    if (value) {
      const chunkValue = decoder.decode(value);
      parser.feed(chunkValue);
    }
  }
}