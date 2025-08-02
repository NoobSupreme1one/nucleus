import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import type { ProBusinessReport } from "@shared/types";
import { ExecutiveSummarySection } from "./pro-report/ExecutiveSummarySection";
import { CompanyDescriptionSection } from "./pro-report/CompanyDescriptionSection";
import { MarketAnalysisSection } from "./pro-report/MarketAnalysisSection";
import { OrganizationManagementSection } from "./pro-report/OrganizationManagementSection";
import { ProductServiceSection } from "./pro-report/ProductServiceSection";
import { MarketingSalesSection } from "./pro-report/MarketingSalesSection";
import { FinancialProjectionsSection } from "./pro-report/FinancialProjectionsSection";
import { FundingOpportunitiesSection } from "./pro-report/FundingOpportunitiesSection";
import { StartupResourcesSection } from "./pro-report/StartupResourcesSection";
import { DomainSuggestionsSection } from "./pro-report/DomainSuggestionsSection";
import { FounderMatchingSection } from "./pro-report/FounderMatchingSection";

interface ProReportDisplayProps {
  proReport: ProBusinessReport;
  ideaTitle: string;
}

export function ProReportDisplay({ proReport, ideaTitle }: ProReportDisplayProps) {
  const handlePrintReport = () => {
    window.print();
  };

  const handleExportPDF = () => {
    // This would integrate with a PDF generation library
    console.log('Export PDF functionality would be implemented here');
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center mb-8">
        <Badge className="bg-gradient-to-r from-primary to-secondary text-white mb-4 px-4 py-2">
          <i className="fas fa-crown mr-2"></i>
          Pro Business Report
        </Badge>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{ideaTitle}</h1>
        <p className="text-gray-600 mb-4">Comprehensive Business Plan & Analysis</p>
        
        <div className="flex justify-center space-x-4 mb-6">
          <Button variant="outline" onClick={handlePrintReport}>
            <i className="fas fa-print mr-2"></i>
            Print Report
          </Button>
          <Button variant="outline" onClick={handleExportPDF}>
            <i className="fas fa-file-pdf mr-2"></i>
            Export PDF
          </Button>
        </div>

        <div className="flex justify-center space-x-6 text-sm text-gray-500">
          <div className="flex items-center">
            <i className="fas fa-calendar mr-2"></i>
            Generated: {new Date(proReport.generatedAt).toLocaleDateString()}
          </div>
          <div className="flex items-center">
            <i className="fas fa-chart-line mr-2"></i>
            Confidence: {proReport.confidenceScore}%
          </div>
          <div className="flex items-center">
            <i className="fas fa-code-branch mr-2"></i>
            Version: {proReport.version}
          </div>
        </div>
      </div>

      <Separator />

      {/* Table of Contents */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50">
        <CardHeader>
          <CardTitle className="flex items-center">
            <i className="fas fa-list text-blue-600 mr-2"></i>
            Table of Contents
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <a href="#executive-summary" className="block text-sm hover:text-primary transition-colors">
                1. Executive Summary
              </a>
              <a href="#company-description" className="block text-sm hover:text-primary transition-colors">
                2. Company Description
              </a>
              <a href="#market-analysis" className="block text-sm hover:text-primary transition-colors">
                3. Market Analysis
              </a>
              <a href="#organization-management" className="block text-sm hover:text-primary transition-colors">
                4. Organization & Management
              </a>
              <a href="#product-service" className="block text-sm hover:text-primary transition-colors">
                5. Product/Service Line
              </a>
              <a href="#marketing-sales" className="block text-sm hover:text-primary transition-colors">
                6. Marketing & Sales Strategy
              </a>
            </div>
            <div className="space-y-2">
              <a href="#financial-projections" className="block text-sm hover:text-primary transition-colors">
                7. Financial Projections
              </a>
              <a href="#funding-opportunities" className="block text-sm hover:text-primary transition-colors">
                8. Funding Opportunities
              </a>
              <a href="#startup-resources" className="block text-sm hover:text-primary transition-colors">
                9. Startup Resources
              </a>
              <a href="#domain-suggestions" className="block text-sm hover:text-primary transition-colors">
                10. Domain Suggestions
              </a>
              <a href="#founder-matching" className="block text-sm hover:text-primary transition-colors">
                11. Founder Matching
              </a>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Report Sections */}
      <div className="space-y-12">
        <section id="executive-summary">
          <ExecutiveSummarySection data={proReport.executiveSummary} />
        </section>

        <section id="company-description">
          <CompanyDescriptionSection data={proReport.companyDescription} />
        </section>

        <section id="market-analysis">
          <MarketAnalysisSection data={proReport.enhancedMarketAnalysis} />
        </section>

        <section id="organization-management">
          <OrganizationManagementSection data={proReport.organizationManagement} />
        </section>

        <section id="product-service">
          <ProductServiceSection data={proReport.productServiceLine} />
        </section>

        <section id="marketing-sales">
          <MarketingSalesSection data={proReport.marketingSalesStrategy} />
        </section>

        <section id="financial-projections">
          <FinancialProjectionsSection data={proReport.financialProjections} />
        </section>

        <section id="funding-opportunities">
          <FundingOpportunitiesSection data={proReport.fundingOpportunities} />
        </section>

        <section id="startup-resources">
          <StartupResourcesSection data={proReport.startupResources} />
        </section>

        <section id="domain-suggestions">
          <DomainSuggestionsSection data={proReport.domainSuggestions} />
        </section>

        <section id="founder-matching">
          <FounderMatchingSection data={proReport.founderMatches} />
        </section>
      </div>

      {/* Footer */}
      <div className="text-center py-8 border-t">
        <p className="text-gray-500 text-sm">
          This report was generated using advanced AI analysis and market research.
          <br />
          Last updated: {new Date(proReport.lastUpdated).toLocaleDateString()}
        </p>
      </div>
    </div>
  );
}
