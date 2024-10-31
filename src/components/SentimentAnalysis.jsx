// src/components/SentimentAnalysis.jsx

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import ReactWordcloud from 'react-wordcloud';
import './SentimentAnalysis.css'; // Import the CSS file for styling


function SentimentAnalysis({ crypto }) {
  const [sentimentData, setSentimentData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSentiment = async () => {
      try {
        const response = await axios.get(
          `https://stingray-app-prmsm.ondigitalocean.app/api/sentiment/${crypto}`
        );
        setSentimentData(response.data);
      } catch (error) {
        console.error('Error fetching sentiment data:', error);
        setError('Failed to fetch sentiment data.');
      }
    };

    fetchSentiment();
  }, [crypto]);

  if (error) {
    return <div className="sentiment-container error">{error}</div>;
  }

  if (!sentimentData) {
    return <div className="sentiment-container">Loading sentiment data...</div>;
  }

  return (
    <div className="sentiment-container">
      <h3>Social Sentiment Analysis</h3>
      {sentimentData.message ? (
        <p>{sentimentData.message}</p>
      ) : (
        <>
          <p>
            <strong>Average Sentiment Score:</strong> {sentimentData.averageScore.toFixed(2)} (
            {sentimentData.averageScore > 0
              ? 'Positive'
              : sentimentData.averageScore < 0
              ? 'Negative'
              : 'Neutral'}
            )
          </p>
          <p>
            <strong>Posts Analyzed:</strong> {sentimentData.postsAnalyzed}
          </p>

          {/* Analyzed Posts List */}
          <h4>Analyzed Posts</h4>
          <ul className="posts-list">
            {sentimentData.results.map((post, index) => (
              <li key={index} className="post-item">
                <p className="post-title">{post.title}</p>
                <p className="post-score">
                  Score: {post.score} (
                  {post.score > 0 ? 'Positive' : post.score < 0 ? 'Negative' : 'Neutral'})
                </p>
              </li>
            ))}
          </ul>

          {/* Word Cloud Visualization */}
          <h4>Word Cloud</h4>
          <WordCloud cryptoData={sentimentData.results} />
        </>
      )}
    </div>
  );
}

// Separate component for Word Cloud to keep SentimentAnalysis clean
function WordCloud({ cryptoData }) {
  // Prepare words data from post titles
  const words = cryptoData
    .flatMap((post) => post.title.split(' '))
    .map((word) => word.toLowerCase().replace(/[^a-zA-Z0-9]/g, ''))
    .filter((word) => word.length > 3); // Filter out short words

  // Count word frequencies
  const wordCounts = words.reduce((acc, word) => {
    if (word) { // Ensure word is not empty after cleaning
      acc[word] = acc[word] ? acc[word] + 1 : 1;
    }
    return acc;
  }, {});

  // Convert to array format expected by react-wordcloud
  const wordCloudData = Object.keys(wordCounts).map((word) => ({
    text: word,
    value: wordCounts[word],
  }));

  // Define word cloud options
  // Define word cloud options with the Poppins font
const options = {
    rotations: 2,
    rotationAngles: [-90, 0],
    fontSizes: [15, 60],
    fontFamily: 'Poppins', // Specify the font family
    // Add more customization options as needed
  };
  
  return (
    <div className="wordcloud-container">
      <ReactWordcloud words={wordCloudData} options={options} />
    </div>
  );
}

export default SentimentAnalysis;
