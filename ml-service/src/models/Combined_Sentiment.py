from .VADER_Sentiment import analyze_sentiment
from .textBlob_Sentiment import analyze_sentiment_textblob

def analyze_sentiment_combined(text):
    """
    Combine VADER and TextBlob for more robust sentiment analysis
    """
    vader_result = analyze_sentiment(text)
    textblob_result = analyze_sentiment_textblob(text)
    
    # Simple average of the two approaches
    combined_score = (vader_result['compound'] + textblob_result['polarity']) / 2
    
    if combined_score > 0.1:
        classification = 'positive'
    elif combined_score < -0.1:
        classification = 'negative'
    else:
        classification = 'neutral'
    
    return {
        'vader_score': vader_result['compound'],
        'textblob_score': textblob_result['polarity'],
        'combined_score': combined_score,
        'classification': classification
    }