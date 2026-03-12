// PDF Generation utility for Quiz Reports
export const generateComprehensivePDF = (item, report, questions, answers, score, isAttempt, LIKERT_LABELS, extractImageFromMarkdown, extractOrGenerateVisuals) => {
  // Format timestamp in IST with 12-hour clock
  const timestamp = new Date().toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  });
  
  const { text: analysisText, imageUrl } = extractImageFromMarkdown(report.Data_Analysis || '');
  const visuals = extractOrGenerateVisuals(report);
  
  // Generate chart HTML
  const chartsHTML = visuals.map((visual) => {
    if (visual.chartType === 'bar') {
      const maxValue = Math.max(...visual.datasets[0].data);
      return `
        <div class="chart-section">
          <div class="chart-title">${visual.chartTitle}</div>
          <div class="bar-chart">
            ${visual.labels.map((label, idx) => {
              const value = visual.datasets[0].data[idx];
              const percentage = (value / maxValue) * 100;
              return `
                <div class="bar-item">
                  <div class="bar-label">${label}</div>
                  <div class="bar-container">
                    <div class="bar-fill" style="width: ${percentage}%; background: linear-gradient(90deg, #1E3A8A, #0D9488);"></div>
                    <div class="bar-value">${value}</div>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      `;
    } else if (visual.chartType === 'pie') {
      const total = visual.datasets[0].data.reduce((a, b) => a + b, 0);
      return `
        <div class="chart-section">
          <div class="chart-title">${visual.chartTitle}</div>
          <div class="pie-chart">
            ${visual.labels.map((label, idx) => {
              const value = visual.datasets[0].data[idx];
              const percentage = ((value / total) * 100).toFixed(1);
              const colors = ['#1E3A8A', '#0D9488', '#D97706'];
              return `
                <div class="pie-item">
                  <div class="pie-color" style="background-color: ${colors[idx % 3]}"></div>
                  <div class="pie-label">${label}: <strong>${percentage}%</strong> (${value})</div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      `;
    }
    return '';
  }).join('');
  
  // Generate questions and answers HTML
  const questionsHTML = isAttempt && questions.length > 0 ? `
    <div class="section">
      <div class="section-title">📝 Questions & Your Responses</div>
      ${questions.map((q, idx) => {
        const userAnswer = answers[idx];
        const isCorrect = q.correct_index !== undefined && userAnswer === q.correct_index;
        
        return `
          <div class="question-card">
            <div class="question-header">
              <span class="question-number">Question ${idx + 1}</span>
              ${q.correct_index !== undefined ? `
                <span class="result-badge ${isCorrect ? 'correct' : 'incorrect'}">
                  ${isCorrect ? '✓ Correct' : '✗ Incorrect'}
                </span>
              ` : ''}
            </div>
            <div class="question-text">${q.question_text || q.text || 'Question text not available'}</div>
            
            ${q.options && q.options.length > 0 ? `
              <div class="options-list">
                ${q.options.map((opt, optIdx) => {
                  const isUserAnswer = userAnswer === optIdx;
                  const isCorrectAnswer = q.correct_index === optIdx;
                  let className = 'option';
                  if (isUserAnswer && isCorrect) className += ' user-correct';
                  else if (isUserAnswer && !isCorrect) className += ' user-wrong';
                  else if (isCorrectAnswer) className += ' correct-option';
                  
                  return `
                    <div class="${className}">
                      <span class="option-letter">${String.fromCharCode(65 + optIdx)}.</span>
                      ${opt}
                      ${isUserAnswer ? ' <span class="badge">Your Answer</span>' : ''}
                      ${isCorrectAnswer && !isUserAnswer ? ' <span class="badge correct">Correct Answer</span>' : ''}
                    </div>
                  `;
                }).join('')}
              </div>
            ` : `
              <div class="likert-response">
                <strong>Your Response:</strong> ${LIKERT_LABELS[userAnswer] || userAnswer || 'No response'}
              </div>
            `}
          </div>
        `;
      }).join('')}
    </div>
  ` : '';
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          padding: 30px;
          color: #1E293B;
          line-height: 1.6;
          background: #F8FAFC;
        }
        .header {
          background: linear-gradient(135deg, #1E3A8A 0%, #0D9488 100%);
          color: white;
          padding: 30px;
          border-radius: 12px;
          margin-bottom: 30px;
          text-align: center;
        }
        h1 { margin: 0 0 10px 0; font-size: 26px; }
        .timestamp { font-size: 13px; opacity: 0.9; }
        .score-card {
          background: linear-gradient(135deg, #D97706 0%, #F59E0B 100%);
          color: white;
          padding: 25px;
          border-radius: 12px;
          text-align: center;
          margin-bottom: 25px;
        }
        .score-value { font-size: 42px; font-weight: 700; }
        .section {
          background: white;
          padding: 25px;
          border-radius: 12px;
          margin-bottom: 20px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        .section-title {
          font-size: 20px;
          font-weight: 700;
          color: #1E3A8A;
          margin-bottom: 20px;
          padding-bottom: 10px;
          border-bottom: 2px solid #E2E8F0;
        }
        .chart-section {
          margin-bottom: 30px;
          padding: 20px;
          background: #F8FAFC;
          border-radius: 10px;
        }
        .chart-title {
          font-size: 18px;
          font-weight: 600;
          color: #1E3A8A;
          margin-bottom: 15px;
          text-align: center;
        }
        .bar-chart { margin-top: 15px; }
        .bar-item { margin-bottom: 12px; }
        .bar-label {
          font-size: 13px;
          font-weight: 600;
          color: #475569;
          margin-bottom: 5px;
        }
        .bar-container {
          position: relative;
          background: #E2E8F0;
          height: 30px;
          border-radius: 6px;
          overflow: hidden;
        }
        .bar-fill {
          height: 100%;
          border-radius: 6px;
          transition: width 0.3s;
        }
        .bar-value {
          position: absolute;
          right: 10px;
          top: 50%;
          transform: translateY(-50%);
          font-weight: 700;
          color: #1E293B;
          font-size: 13px;
        }
        .pie-chart { margin-top: 15px; }
        .pie-item {
          display: flex;
          align-items: center;
          margin-bottom: 10px;
          padding: 8px;
          background: white;
          border-radius: 6px;
        }
        .pie-color {
          width: 20px;
          height: 20px;
          border-radius: 4px;
          margin-right: 12px;
        }
        .pie-label { font-size: 14px; color: #475569; }
        .question-card {
          background: #F8FAFC;
          padding: 20px;
          border-radius: 10px;
          margin-bottom: 20px;
          border-left: 4px solid #1E3A8A;
        }
        .question-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }
        .question-number {
          font-weight: 700;
          color: #1E3A8A;
          font-size: 14px;
        }
        .result-badge {
          padding: 4px 12px;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 600;
        }
        .result-badge.correct {
          background: #10B981;
          color: white;
        }
        .result-badge.incorrect {
          background: #EF4444;
          color: white;
        }
        .question-text {
          font-size: 15px;
          color: #1E293B;
          margin-bottom: 15px;
          line-height: 1.6;
        }
        .options-list { margin-top: 10px; }
        .option {
          padding: 12px 15px;
          margin-bottom: 8px;
          border-radius: 8px;
          background: white;
          border: 2px solid #E2E8F0;
          font-size: 14px;
        }
        .option-letter {
          font-weight: 700;
          color: #1E3A8A;
          margin-right: 8px;
        }
        .option.user-correct {
          background: #D1FAE5;
          border-color: #10B981;
        }
        .option.user-wrong {
          background: #FEE2E2;
          border-color: #EF4444;
        }
        .option.correct-option {
          background: #DBEAFE;
          border-color: #3B82F6;
        }
        .badge {
          display: inline-block;
          padding: 2px 8px;
          border-radius: 4px;
          font-size: 11px;
          font-weight: 600;
          margin-left: 8px;
          background: #1E3A8A;
          color: white;
        }
        .badge.correct {
          background: #10B981;
        }
        .likert-response {
          padding: 15px;
          background: white;
          border-radius: 8px;
          border: 2px solid #E2E8F0;
          margin-top: 10px;
        }
        .card {
          background: #F8FAFC;
          padding: 20px;
          border-radius: 10px;
          margin-bottom: 15px;
        }
        .card-title {
          font-weight: 700;
          color: #1E3A8A;
          margin-bottom: 10px;
          font-size: 16px;
        }
        .card-text {
          color: #475569;
          line-height: 1.8;
        }
        .activity {
          background: white;
          padding: 15px;
          border-radius: 8px;
          margin-bottom: 12px;
          border: 1px solid #E2E8F0;
        }
        .activity-title {
          font-weight: 600;
          color: #1E293B;
          margin-bottom: 8px;
        }
        .activity-desc {
          color: #64748B;
          font-size: 14px;
          margin-bottom: 8px;
        }
        .activity-duration {
          color: #0D9488;
          font-size: 13px;
          font-weight: 500;
        }
        .image-container {
          margin-top: 20px;
          text-align: center;
        }
        .image-container img {
          max-width: 100%;
          height: auto;
          border-radius: 12px;
          margin-bottom: 10px;
        }
        .image-caption {
          font-size: 12px;
          color: #64748B;
          font-style: italic;
        }
        .footer {
          margin-top: 30px;
          padding-top: 20px;
          border-top: 2px solid #E2E8F0;
          text-align: center;
          color: #64748B;
          font-size: 11px;
        }
        @media print {
          body { padding: 20px; }
          .section { page-break-inside: avoid; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>${isAttempt ? '📊 Quiz Analysis Report' : '📈 Student Development Report'}</h1>
        <div class="timestamp">Generated on: ${timestamp}</div>
      </div>

      ${isAttempt && score !== null ? `
        <div class="score-card">
          <div style="font-size: 14px; margin-bottom: 5px;">Final Score</div>
          <div class="score-value">${score.toFixed(1)}%</div>
        </div>
      ` : ''}

      ${chartsHTML ? `
        <div class="section">
          <div class="section-title">📊 Performance Charts</div>
          ${chartsHTML}
        </div>
      ` : ''}

      ${questionsHTML}

      ${report.Data_Analysis ? `
        <div class="section">
          <div class="section-title">📋 Summary Analysis</div>
          <div class="card">
            <div class="card-text">${analysisText}</div>
            ${imageUrl ? `
              <div class="image-container">
                <img src="${imageUrl}" alt="Emotional Insight"/>
                <div class="image-caption">Emotional Insight</div>
              </div>
            ` : ''}
          </div>
        </div>
      ` : ''}

      ${report.Sub_grouping_Recommendation ? `
        <div class="section">
          <div class="section-title">👥 Sub-grouping Recommendation</div>
          <div class="card">
            <div class="card-text">${report.Sub_grouping_Recommendation}</div>
          </div>
        </div>
      ` : ''}

      ${report.Targeted_SEL_Activities && report.Targeted_SEL_Activities.length > 0 ? `
        <div class="section">
          <div class="section-title">🎯 Targeted SEL Activities</div>
          ${report.Targeted_SEL_Activities.map((activity, index) => `
            <div class="activity">
              <div class="activity-title">${index + 1}. ${activity.title || activity.name || `Activity ${index + 1}`}</div>
              ${activity.description ? `<div class="activity-desc">${activity.description}</div>` : ''}
              ${activity.duration ? `<div class="activity-duration">⏱️ Duration: ${activity.duration}</div>` : ''}
            </div>
          `).join('')}
        </div>
      ` : ''}

      ${report.Progress_Tracking ? `
        <div class="section">
          <div class="section-title">📈 Progress Tracking</div>
          <div class="card">
            <div class="card-text">${report.Progress_Tracking}</div>
          </div>
        </div>
      ` : ''}

      <div class="footer">
        <p><strong>Student Development Tracker</strong> - Holistic Assessment Platform</p>
        <p>This report is confidential and intended for educational purposes only.</p>
      </div>
    </body>
    </html>
  `;
};
