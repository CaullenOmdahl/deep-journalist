"use client";
import dynamic from "next/dynamic";
import { useTranslation } from "react-i18next";
import { useGlobalStore } from "@/store/global";
import { Button } from "@/components/Button";
import { useState } from "react";
import { 
  Search, 
  FileText, 
  Shield, 
  BarChart, 
  Clock, 
  Users, 
  Scale,
  Link,
  Radar,
  CalendarDays,
  AlertTriangle,
  MessageSquare,
  CheckCircle2,
  Layout
} from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Header = dynamic(() => import("@/components/Header"));
const Setting = dynamic(() => import("@/components/Setting"));
const Topic = dynamic(() => import("@/components/Research/Topic"));
const Feedback = dynamic(() => import("@/components/Research/Feedback"));
const SearchResult = dynamic(
  () => import("@/components/Research/SearchResult")
);
const FinalReport = dynamic(() => import("@/components/Research/FinalReport"));
const History = dynamic(() => import("@/components/History"));
const RateLimitStatus = dynamic(() => import("@/components/RateLimitStatus"));

function Home() {
  const { t } = useTranslation();
  const globalStore = useGlobalStore();
  const [showLandingPage, setShowLandingPage] = useState(!globalStore.hasUsedBefore);

  // Mark as used after first interaction
  const handleStartResearch = () => {
    globalStore.setHasUsedBefore(true);
    setShowLandingPage(false);
  };

  if (!showLandingPage) {
    return (
      <div className="max-w-screen-md mx-auto px-4">
        <Header />
        <main>
          <div className="my-2 sticky top-0 z-10">
            <RateLimitStatus />
          </div>
          <Topic />
          <Feedback />
          <SearchResult />
          <FinalReport />
        </main>
        <footer className="my-4 text-center text-sm text-gray-600 print:hidden">
          <a href="https://github.com/u14app/" target="_blank" rel="noopener noreferrer">
            {t("copyright", {
              name: "Deep Journalist",
            })}
          </a>
        </footer>
        <aside className="print:hidden">
          <Setting
            open={globalStore.openSetting}
            onClose={() => globalStore.setOpenSetting(false)}
          />
          <History
            open={globalStore.openHistory}
            onClose={() => globalStore.setOpenHistory(false)}
          />
        </aside>
      </div>
    );
  }

  return (
    <div className="max-w-screen-xl mx-auto px-4 py-8">
      <header className="py-6 text-center mb-8">
        <h1 className="text-4xl font-bold mb-2">Deep Journalist</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Advanced AI-powered research assistant for professional journalism
        </p>
      </header>

      <main>
        <section className="max-w-4xl mx-auto mb-16">
          <div className="flex flex-col md:flex-row gap-8 items-center">
            <div className="md:w-1/2">
              <h2 className="text-3xl font-semibold mb-4">Elevate Your Journalism</h2>
              <p className="text-lg mb-4">
                Deep Journalist combines the power of AI with journalistic best practices to help you research, verify, and write accurate, balanced stories.
              </p>
              <p className="mb-6">
                From investigating complex topics to fact-checking claims, Deep Journalist supports every stage of your reporting process while maintaining the highest journalistic standards.
              </p>
              <Button size="lg" onClick={handleStartResearch} className="gap-2">
                <Search className="h-5 w-5" />
                Start Researching
              </Button>
            </div>
            <div className="md:w-1/2 bg-muted rounded-lg p-6 shadow-sm">
              <h3 className="text-xl font-medium mb-3 flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                Upholding Journalistic Principles
              </h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                  <div>
                    <span className="font-medium">Accuracy & Verification</span>
                    <p className="text-sm text-muted-foreground">Automated fact-checking and claim verification</p>
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                  <div>
                    <span className="font-medium">Fairness & Balance</span>
                    <p className="text-sm text-muted-foreground">Tools for detecting bias and ensuring multiple perspectives</p>
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                  <div>
                    <span className="font-medium">Transparency & Attribution</span>
                    <p className="text-sm text-muted-foreground">Source management and proper citation tools</p>
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                  <div>
                    <span className="font-medium">Independence & Integrity</span>
                    <p className="text-sm text-muted-foreground">Source credibility assessment and validation</p>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </section>

        <section className="mb-16">
          <h2 className="text-2xl font-semibold text-center mb-8">Key Features for Journalists</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Link className="h-5 w-5 text-primary" />
                  Source Validation
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p>Automatically assess the credibility of sources with domain reputation checking, bias detection, and transparency indicators.</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-primary" />
                  Bias Detection
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p>Identify potentially biased language in your writing and get suggestions for more neutral alternatives.</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-primary" />
                  Claim Verification
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p>Track and verify claims with visual indicators for verified, unverified, and disputed information.</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CalendarDays className="h-5 w-5 text-primary" />
                  Timeline Visualization
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p>Automatically extract and visualize chronological events from your sources to establish clear timelines.</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Radar className="h-5 w-5 text-primary" />
                  Story Tracking
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p>Monitor developing stories for updates and be notified of new information or changing narratives.</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Layout className="h-5 w-5 text-primary" />
                  Article Structure
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p>Access professional templates for different article formats with guidance on structure and best practices.</p>
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="max-w-4xl mx-auto mb-16">
          <Tabs defaultValue="research" className="w-full">
            <TabsList className="grid grid-cols-3 mb-8">
              <TabsTrigger value="research">Research Process</TabsTrigger>
              <TabsTrigger value="ethics">Ethical Standards</TabsTrigger>
              <TabsTrigger value="workflow">Journalist Workflow</TabsTrigger>
            </TabsList>
            
            <TabsContent value="research">
              <div className="flex flex-col md:flex-row gap-8 items-center">
                <div className="md:w-1/2">
                  <h3 className="text-2xl font-medium mb-4">Research with Confidence</h3>
                  <p className="mb-3">
                    Deep Journalist streamlines your research process while maintaining the highest standards of journalistic integrity.
                  </p>
                  <ol className="space-y-3">
                    <li className="flex items-start gap-2">
                      <div className="bg-primary text-primary-foreground rounded-full h-6 w-6 flex items-center justify-center text-sm font-medium mt-0.5">1</div>
                      <div>
                        <span className="font-medium">Define your topic</span>
                        <p className="text-sm text-muted-foreground">Ask questions and set your research scope</p>
                      </div>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="bg-primary text-primary-foreground rounded-full h-6 w-6 flex items-center justify-center text-sm font-medium mt-0.5">2</div>
                      <div>
                        <span className="font-medium">Gather and validate sources</span>
                        <p className="text-sm text-muted-foreground">Extract content from URLs with built-in credibility assessment</p>
                      </div>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="bg-primary text-primary-foreground rounded-full h-6 w-6 flex items-center justify-center text-sm font-medium mt-0.5">3</div>
                      <div>
                        <span className="font-medium">Analyze and synthesize</span>
                        <p className="text-sm text-muted-foreground">Create a balanced report with proper citations and fact-checking</p>
                      </div>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="bg-primary text-primary-foreground rounded-full h-6 w-6 flex items-center justify-center text-sm font-medium mt-0.5">4</div>
                      <div>
                        <span className="font-medium">Review and refine</span>
                        <p className="text-sm text-muted-foreground">Check for bias, ensure accuracy, and monitor for updates</p>
                      </div>
                    </li>
                  </ol>
                </div>
                <div className="md:w-1/2">
                  <img 
                    src="/research-process.svg" 
                    alt="Research process illustration"
                    className="w-full h-auto rounded-lg shadow-sm"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = "https://via.placeholder.com/500x350?text=Research+Process";
                    }}
                  />
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="ethics">
              <div className="flex flex-col md:flex-row gap-8 items-center">
                <div className="md:w-1/2">
                  <img 
                    src="/ethics-journalism.svg" 
                    alt="Ethical journalism illustration"
                    className="w-full h-auto rounded-lg shadow-sm"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = "https://via.placeholder.com/500x350?text=Ethical+Journalism";
                    }}
                  />
                </div>
                <div className="md:w-1/2">
                  <h3 className="text-2xl font-medium mb-4">Upholding Ethical Standards</h3>
                  <p className="mb-3">
                    Deep Journalist embeds ethical considerations throughout the research and writing process.
                  </p>
                  <ul className="space-y-3">
                    <li className="flex items-start gap-2">
                      <Scale className="h-5 w-5 text-primary mt-0.5" />
                      <div>
                        <span className="font-medium">Balanced Perspectives</span>
                        <p className="text-sm text-muted-foreground">Tools to ensure multiple viewpoints are represented fairly</p>
                      </div>
                    </li>
                    <li className="flex items-start gap-2">
                      <Users className="h-5 w-5 text-primary mt-0.5" />
                      <div>
                        <span className="font-medium">Source Diversity</span>
                        <p className="text-sm text-muted-foreground">Monitoring of source diversity across demographics and viewpoints</p>
                      </div>
                    </li>
                    <li className="flex items-start gap-2">
                      <Shield className="h-5 w-5 text-primary mt-0.5" />
                      <div>
                        <span className="font-medium">Content Warnings</span>
                        <p className="text-sm text-muted-foreground">Automated detection of potentially sensitive or harmful content</p>
                      </div>
                    </li>
                    <li className="flex items-start gap-2">
                      <FileText className="h-5 w-5 text-primary mt-0.5" />
                      <div>
                        <span className="font-medium">Proper Attribution</span>
                        <p className="text-sm text-muted-foreground">Citation management for accurate and ethical source attribution</p>
                      </div>
                    </li>
                  </ul>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="workflow">
              <div className="flex flex-col md:flex-row gap-8 items-center">
                <div className="md:w-1/2">
                  <h3 className="text-2xl font-medium mb-4">Seamless Integration</h3>
                  <p className="mb-3">
                    Deep Journalist adapts to your existing workflow, whether you're a freelance writer or part of a news organization.
                  </p>
                  <ul className="space-y-3">
                    <li className="flex items-start gap-2">
                      <Clock className="h-5 w-5 text-primary mt-0.5" />
                      <div>
                        <span className="font-medium">Time-Saving Research</span>
                        <p className="text-sm text-muted-foreground">Efficiently gather and organize information from multiple sources</p>
                      </div>
                    </li>
                    <li className="flex items-start gap-2">
                      <BarChart className="h-5 w-5 text-primary mt-0.5" />
                      <div>
                        <span className="font-medium">Journalistic Metrics</span>
                        <p className="text-sm text-muted-foreground">Get feedback on your reporting against professional standards</p>
                      </div>
                    </li>
                    <li className="flex items-start gap-2">
                      <Layout className="h-5 w-5 text-primary mt-0.5" />
                      <div>
                        <span className="font-medium">Structured Templates</span>
                        <p className="text-sm text-muted-foreground">Access templates for different article types and formats</p>
                      </div>
                    </li>
                    <li className="flex items-start gap-2">
                      <Radar className="h-5 w-5 text-primary mt-0.5" />
                      <div>
                        <span className="font-medium">Ongoing Monitoring</span>
                        <p className="text-sm text-muted-foreground">Stay updated on developing stories and evolving narratives</p>
                      </div>
                    </li>
                  </ul>
                </div>
                <div className="md:w-1/2">
                  <img 
                    src="/journalist-workflow.svg" 
                    alt="Journalist workflow illustration"
                    className="w-full h-auto rounded-lg shadow-sm"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = "https://via.placeholder.com/500x350?text=Journalist+Workflow";
                    }}
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </section>

        <section className="text-center mb-12">
          <h2 className="text-2xl font-semibold mb-6">Ready to Elevate Your Reporting?</h2>
          <Button size="lg" onClick={handleStartResearch} className="gap-2">
            <Search className="h-5 w-5" />
            Start Using Deep Journalist
          </Button>
        </section>
      </main>

      <footer className="border-t pt-8 mt-12 text-center">
        <p className="text-sm text-muted-foreground">
          Deep Journalist is committed to supporting ethical journalism and advancing the profession's highest standards.
        </p>
        <p className="text-sm mt-2">
          <a href="https://github.com/u14app/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
            {t("copyright", {
              name: "Deep Journalist",
            })}
          </a>
        </p>
      </footer>
    </div>
  );
}

export default Home;
