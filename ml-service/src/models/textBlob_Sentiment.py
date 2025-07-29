from textblob import TextBlob

def analyze_sentiment_textblob(text):
    """
    Analyze sentiment using TextBlob
    
    Parameters:
    text (str): Text to analyze
    
    Returns:
    dict: TextBlob sentiment scores
    """
    blob = TextBlob(text)
    polarity = blob.sentiment.polarity  # -1 to 1
    
    # Convert to same classification system as VADER
    if polarity > 0.1:
        classification = 'positive'
    elif polarity < -0.1:
        classification = 'negative'
    else:
        classification = 'neutral'
    
    return {
        'polarity': polarity,
        'subjectivity': blob.sentiment.subjectivity,
        'classification': classification
    }

