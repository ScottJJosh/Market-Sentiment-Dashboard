# ml-service/src/daily_data_collector.py
import schedule
import time
from datetime import datetime, timedelta
import logging
from news_Collection import full_pipeline
from stock_data import fetch_and_save_stocks
from database_queries import get_api_usage_today

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('data_collection.log'),
        logging.StreamHandler()
    ]
)

# API Limits
MAX_NEWS_CALLS_PER_DAY = 100
MAX_STOCK_CALLS_PER_DAY = 5

def collect_daily_data():
    """Main daily data collection function"""
    logging.info("=== Starting Daily Data Collection ===")
    
    try:
        # Check API usage
        usage = get_api_usage_today()
        logging.info(f"Current API usage: News: {usage['news_calls']}/{MAX_NEWS_CALLS_PER_DAY}, Stock: {usage['stock_calls']}/{MAX_STOCK_CALLS_PER_DAY}")
        
        # Collect stock prices first (uses fewer API calls)
        if usage['stock_calls'] < MAX_STOCK_CALLS_PER_DAY:
            logging.info("Collecting stock price data...")
            tech_stocks = ['AAPL', 'GOOGL', 'MSFT', 'AMZN', 'META', 'TSLA', 'NVDA']
            stock_results = fetch_and_save_stocks(tech_stocks)
            
            success_count = sum(1 for result in stock_results.values() if not isinstance(result, dict) or not result.get('error'))
            logging.info(f"Stock data collection completed: {success_count}/{len(tech_stocks)} successful")
        else:
            logging.warning("Stock API limit reached, skipping stock price collection")
        
        # Collect news and sentiment data
        if usage['news_calls'] < MAX_NEWS_CALLS_PER_DAY:
            logging.info("Collecting news and sentiment data...")
            news_results = full_pipeline()
            logging.info("News and sentiment collection completed")
        else:
            logging.warning("News API limit reached, skipping news collection")
        
        logging.info("=== Daily Data Collection Completed Successfully ===")
        
    except Exception as e:
        logging.error(f"Error in daily data collection: {e}")

def collect_weekly_data():
    """Weekly comprehensive data collection"""
    logging.info("=== Starting Weekly Comprehensive Data Collection ===")
    
    try:
        # Reset API usage tracking for the week
        # Run more comprehensive collection
        logging.info("Running comprehensive news collection...")
        
        # You could run the pipeline with higher article counts for weekly collection
        news_results = full_pipeline()
        
        logging.info("=== Weekly Data Collection Completed ===")
        
    except Exception as e:
        logging.error(f"Error in weekly data collection: {e}")

def schedule_data_collection():
    """Set up the data collection schedule"""
    
    # Daily collection at 9 AM (before market open)
    schedule.every().day.at("09:00").do(collect_daily_data)
    
    # Additional collection at 6 PM (after market close)
    schedule.every().day.at("18:00").do(collect_daily_data)
    
    # Weekly comprehensive collection on Sunday at 2 AM
    schedule.every().sunday.at("02:00").do(collect_weekly_data)
    
    logging.info("Data collection schedule set up:")
    logging.info("- Daily collection: 9:00 AM and 6:00 PM")
    logging.info("- Weekly collection: Sunday 2:00 AM")

def run_scheduler():
    """Run the scheduler"""
    schedule_data_collection()
    
    logging.info("Data collection scheduler started. Press Ctrl+C to stop.")
    
    try:
        while True:
            schedule.run_pending()
            time.sleep(60)  # Check every minute
    except KeyboardInterrupt:
        logging.info("Data collection scheduler stopped.")

def manual_collection():
    """Run data collection manually"""
    print("Manual data collection options:")
    print("1. Collect news and sentiment data")
    print("2. Collect stock price data")
    print("3. Collect all data")
    print("4. Check API usage")
    
    choice = input("Enter your choice (1-4): ")
    
    if choice == "1":
        print("Collecting news and sentiment data...")
        full_pipeline()
        print("News collection completed!")
        
    elif choice == "2":
        print("Collecting stock price data...")
        tech_stocks = ['AAPL', 'GOOGL', 'MSFT', 'AMZN', 'META', 'TSLA', 'NVDA']
        fetch_and_save_stocks(tech_stocks)
        print("Stock price collection completed!")
        
    elif choice == "3":
        print("Collecting all data...")
        collect_daily_data()
        print("All data collection completed!")
        
    elif choice == "4":
        usage = get_api_usage_today()
        print(f"API Usage Today:")
        print(f"  News API calls: {usage['news_calls']}/{MAX_NEWS_CALLS_PER_DAY}")
        print(f"  Stock API calls: {usage['stock_calls']}/{MAX_STOCK_CALLS_PER_DAY}")
        
    else:
        print("Invalid choice!")

if __name__ == "__main__":
    import sys
    
    if len(sys.argv) > 1 and sys.argv[1] == "manual":
        manual_collection()
    elif len(sys.argv) > 1 and sys.argv[1] == "once":
        collect_daily_data()
    else:
        run_scheduler()