@echo off
set PYTHONPATH=%PYTHONPATH%;%CD%
cd tests
python -m pytest analysis/test_bias_analyzer.py analysis/test_article_analyzer.py -v
cd .. 