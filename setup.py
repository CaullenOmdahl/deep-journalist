from setuptools import setup, find_packages

# Read requirements
with open('requirements.txt') as f:
    requirements = [line.strip() for line in f if line.strip() and not line.startswith('#')]

# Read long description from README
with open('README.md', encoding='utf-8') as f:
    long_description = f.read()

setup(
    name="deep-journalist",
    version="1.0.0",
    description="AI-powered journalistic research assistant",
    long_description=long_description,
    long_description_content_type="text/markdown",
    author="Caullen Omdahl",
    author_email="caullen@gmail.com",
    url="https://github.com/CaullenOmdahl/deep-journalist",
    packages=find_packages(),
    install_requires=requirements,
    python_requires=">=3.8",
    entry_points={
        'console_scripts': [
            'deep-journalist=app.cli:main',
            'deep-journalist-server=scripts.start_server:main',
            'deep-journalist-install=scripts.install_dev:main',
            'deep-journalist-test=scripts.run_tests:main',
            'deep-journalist-analyze=scripts.analyze_article:main',
        ],
    },
    classifiers=[
        "Development Status :: 4 - Beta",
        "Intended Audience :: Science/Research",
        "License :: OSI Approved :: MIT License",
        "Operating System :: OS Independent",
        "Programming Language :: Python :: 3",
        "Programming Language :: Python :: 3.8",
        "Programming Language :: Python :: 3.9",
        "Programming Language :: Python :: 3.10",
        "Topic :: Scientific/Engineering :: Artificial Intelligence",
        "Topic :: Text Processing :: Linguistic",
    ],
    keywords="journalism, research, ai, nlp, bias-detection",
    project_urls={
        "Bug Reports": "https://github.com/CaullenOmdahl/deep-journalist/issues",
        "Source": "https://github.com/CaullenOmdahl/deep-journalist",
    },
    include_package_data=True,
    zip_safe=False,
) 