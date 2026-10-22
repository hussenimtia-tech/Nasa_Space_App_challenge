exports.handler = async function (event, context) {
  // CORS Response Headers
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json"
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers, body: "" };
  }

  try {
    const progressData = {
      completedLessons: 5,
      totalLessons: 12,
      progressPercent: 42,
      currentChapter: "Deep Space Exploration"
    };

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(progressData)
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: "Failed to load progress", message: err.message })
    };
  }
};
