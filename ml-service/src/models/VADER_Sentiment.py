from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer

def analyze_sentiment(text):
    """
    Analyze sentiment of article text using VADER
    
    Parameters:
    text (str): Article title + description to analyze
    
    Returns:
    dict: {'compound': score, 'classification': 'positive'/'negative'/'neutral'}
    """
    
    analyzer = SentimentIntensityAnalyzer()
    scores = analyzer.polarity_scores(text)
    compound = scores['compound']
    
    # Your threshold classification
    if compound > 0.1:
        classification = 'positive'
    elif compound < -0.1:
        classification = 'negative'
    else:
        classification = 'neutral'
    
    return {
        'compound': compound,
        'classification': classification
    }