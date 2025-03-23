'use client'

import { useState } from 'react'
import { Box, Container, Heading, Text, VStack, Textarea, Button, useToast } from '@chakra-ui/react'
import axios from 'axios'

export default function Home() {
  const [article, setArticle] = useState('')
  const [analysis, setAnalysis] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const toast = useToast()

  const analyzeArticle = async () => {
    if (!article.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter an article to analyze',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
      return
    }

    setLoading(true)
    try {
      const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/analyze`, {
        article: article.trim()
      })
      setAnalysis(response.data)
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to analyze article. Please try again.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Container maxW="container.xl" py={10}>
      <VStack spacing={8} align="stretch">
        <Box textAlign="center">
          <Heading as="h1" size="2xl" mb={4}>Deep Journalist</Heading>
          <Text fontSize="xl" color="gray.600">
            AI-powered journalistic research assistant for comprehensive, unbiased news analysis
          </Text>
        </Box>

        <Box>
          <Textarea
            value={article}
            onChange={(e) => setArticle(e.target.value)}
            placeholder="Paste your article here..."
            size="lg"
            minH="200px"
            mb={4}
          />
          <Button
            colorScheme="blue"
            size="lg"
            width="full"
            onClick={analyzeArticle}
            isLoading={loading}
          >
            Analyze Article
          </Button>
        </Box>

        {analysis && (
          <Box p={6} borderWidth={1} borderRadius="lg">
            <VStack spacing={4} align="stretch">
              <Box>
                <Heading as="h3" size="md">Bias Analysis</Heading>
                <Text mt={2}>{analysis.bias_analysis}</Text>
              </Box>
              <Box>
                <Heading as="h3" size="md">Source Verification</Heading>
                <Text mt={2}>{analysis.source_verification}</Text>
              </Box>
              <Box>
                <Heading as="h3" size="md">Key Points</Heading>
                <Text mt={2}>{analysis.key_points}</Text>
              </Box>
            </VStack>
          </Box>
        )}
      </VStack>
    </Container>
  )
} 