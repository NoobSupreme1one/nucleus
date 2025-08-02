import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import type { ProBusinessReport } from "@shared/types";

interface FinancialProjectionsSectionProps {
  data: ProBusinessReport['financialProjections'];
}

export function FinancialProjectionsSection({ data }: FinancialProjectionsSectionProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value}%`;
  };

  return (
    <Card className="bg-gradient-to-r from-green-50 to-emerald-50">
      <CardHeader>
        <CardTitle className="text-2xl flex items-center">
          <i className="fas fa-chart-bar text-green-600 mr-3"></i>
          7. Financial Projections
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-8">
        {/* Revenue Projections */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue Projections</h3>
          <div className="bg-white rounded-lg p-6 border border-green-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {data.revenueProjections.map((projection, index) => (
                <div key={index} className="text-center">
                  <div className="text-2xl font-bold text-green-600 mb-2">
                    {formatCurrency(projection.revenue)}
                  </div>
                  <div className="text-gray-600 mb-2">Year {projection.year}</div>
                  {projection.growth > 0 && (
                    <Badge className="bg-green-100 text-green-800">
                      <i className="fas fa-arrow-up mr-1"></i>
                      {formatPercentage(projection.growth)} growth
                    </Badge>
                  )}
                </div>
              ))}
            </div>
            
            {/* Revenue Growth Chart Placeholder */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h4 className="font-semibold text-gray-900 mb-3">Revenue Growth Trajectory</h4>
              <div className="space-y-2">
                {data.revenueProjections.map((projection, index) => (
                  <div key={index} className="flex items-center space-x-4">
                    <span className="text-sm font-medium w-16">Year {projection.year}</span>
                    <div className="flex-1">
                      <Progress 
                        value={Math.min((projection.revenue / Math.max(...data.revenueProjections.map(p => p.revenue))) * 100, 100)} 
                        className="h-3"
                      />
                    </div>
                    <span className="text-sm text-gray-600 w-24 text-right">
                      {formatCurrency(projection.revenue)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Expense Projections */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Expense Projections</h3>
          <div className="bg-white rounded-lg p-6 border border-green-200">
            <div className="space-y-4">
              {data.expenseProjections.map((expense, index) => (
                <div key={index}>
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium">Year {expense.year}</span>
                    <span className="text-lg font-bold text-red-600">
                      {formatCurrency(expense.expenses)}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    {Object.entries(expense.breakdown).map(([category, amount]) => (
                      <div key={category} className="bg-gray-50 rounded p-2">
                        <div className="text-gray-600 capitalize">{category}</div>
                        <div className="font-semibold">{formatCurrency(amount)}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Profitability Analysis */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Profitability Analysis</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg p-6 border border-green-200 text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">
                {formatPercentage(data.profitabilityAnalysis.grossMargin)}
              </div>
              <div className="text-gray-600">Gross Margin</div>
            </div>
            <div className="bg-white rounded-lg p-6 border border-green-200 text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">
                {formatPercentage(data.profitabilityAnalysis.netMargin)}
              </div>
              <div className="text-gray-600">Net Margin</div>
            </div>
            <div className="bg-white rounded-lg p-6 border border-green-200 text-center">
              <div className="text-2xl font-bold text-purple-600 mb-2">
                {data.profitabilityAnalysis.breakEvenPoint}
              </div>
              <div className="text-gray-600">Break-Even Point</div>
            </div>
          </div>
        </div>

        {/* Cash Flow Projections */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Cash Flow Projections</h3>
          <div className="bg-white rounded-lg p-6 border border-green-200">
            <div className="space-y-3">
              {data.cashFlowProjections.map((cashFlow, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                  <span className="font-medium">Year {cashFlow.year}</span>
                  <div className="text-right">
                    <div className={`font-bold ${cashFlow.cashFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(cashFlow.cashFlow)} Cash Flow
                    </div>
                    <div className="text-sm text-gray-600">
                      Cumulative: {formatCurrency(cashFlow.cumulativeCashFlow)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Funding Requirements */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Funding Requirements</h3>
          <div className="bg-white rounded-lg p-6 border border-green-200">
            <div className="text-center mb-6">
              <div className="text-4xl font-bold text-blue-600 mb-2">
                {formatCurrency(data.fundingRequirements.totalFunding)}
              </div>
              <div className="text-gray-600">Total Funding Required</div>
            </div>

            {/* Use of Funds */}
            <div className="mb-6">
              <h4 className="font-semibold text-gray-900 mb-3">Use of Funds</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.entries(data.fundingRequirements.useOfFunds).map(([category, amount]) => (
                  <div key={category} className="bg-blue-50 rounded-lg p-4 text-center">
                    <div className="text-lg font-bold text-blue-600">
                      {formatCurrency(amount)}
                    </div>
                    <div className="text-sm text-gray-600 capitalize">{category}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Funding Stages */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Funding Stages</h4>
              <div className="space-y-3">
                {data.fundingRequirements.fundingStages.map((stage, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <div className="font-medium">{stage.stage}</div>
                      <div className="text-sm text-gray-600">{stage.timeline}</div>
                    </div>
                    <div className="text-lg font-bold text-green-600">
                      {formatCurrency(stage.amount)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Summary Badge */}
        <div className="text-center pt-4 border-t border-green-200">
          <Badge className="bg-green-100 text-green-800 px-4 py-2">
            <i className="fas fa-calculator mr-2"></i>
            Financial Projections Complete
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}
