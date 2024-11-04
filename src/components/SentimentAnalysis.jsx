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
        if (response.data && typeof response.data.averageScore === 'number') {
          setSentimentData(response.data);
        } else {
          setError('No sentiment data available for this cryptocurrency.');
        }
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
      <div className="sentiment-header">
        <h3>Social Sentiment Analysis</h3>
      </div>
      
      {sentimentData.message ? (
        <p>{sentimentData.message}</p>
      ) : (
        <>
          <div className="sentiment-overview">
            <div className="sentiment-stat">
              <strong>Average Sentiment Score</strong>
              <div className="sentiment-value">
                {sentimentData.averageScore != null 
                  ? sentimentData.averageScore.toFixed(2)
                  : 'N/A'}
                <span className={`score-indicator ${
                  sentimentData.averageScore > 0 
                    ? 'score-positive' 
                    : sentimentData.averageScore < 0 
                    ? 'score-negative' 
                    : 'score-neutral'
                }`}>
                  {sentimentData.averageScore > 0
                    ? 'Positive'
                    : sentimentData.averageScore < 0
                    ? 'Negative'
                    : 'Neutral'}
                </span>
              </div>
            </div>
            <div className="sentiment-stat">
              <strong>Posts Analyzed</strong>
              <div className="sentiment-value">
                {sentimentData.postsAnalyzed || 'N/A'}
              </div>
            </div>
          </div>

          {sentimentData.results && sentimentData.results.length > 0 ? (
            <>
              <div className="posts-section">
                <h4>Analyzed Posts</h4>
                <ul className="posts-list">
                  {sentimentData.results.map((post, index) => (
                    <li key={index} className="post-item">
                      <p className="post-title">{post.title}</p>
                      <p className="post-score">
                        Score: {post.score != null ? post.score.toFixed(2) : 'N/A'}
                        <span className={`score-indicator ${
                          post.score > 0 
                            ? 'score-positive' 
                            : post.score < 0 
                            ? 'score-negative' 
                            : 'score-neutral'
                        }`}>
                          {post.score > 0 
                            ? 'Positive' 
                            : post.score < 0 
                            ? 'Negative' 
                            : 'Neutral'}
                        </span>
                      </p>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="wordcloud-section">
                <h4>Word Cloud</h4>
                <WordCloud cryptoData={sentimentData.results} />
              </div>
            </>
          ) : (
            <p>No sentiment analysis results available.</p>
          )}
        </>
      )}
    </div>
  );
}

// Separate component for Word Cloud to keep SentimentAnalysis clean
function WordCloud({ cryptoData }) {
  if (!Array.isArray(cryptoData) || cryptoData.length === 0) {
    return <div>No data available for word cloud visualization.</div>;
  }

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
    colors: ['#ffffff'], // Set all words to white
    enableTooltip: true,
    deterministic: true,
    padding: 3,
  };
  
  return (
    <div className="wordcloud-container">
      <ReactWordcloud words={wordCloudData} options={options} />
    </div>
  );
}

export default SentimentAnalysis;
