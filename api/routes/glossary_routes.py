from flask import Blueprint, jsonify, request
from datetime import datetime
import uuid
from models.business_glossary import GlossaryTerm, Domain, TaggedAsset

bp = Blueprint('glossary', __name__)

# Mock data - replace with database in production
domains = [
    {"id": "finance", "name": "Finance"},
    {"id": "sales", "name": "Sales"},
    {"id": "marketing", "name": "Marketing"},
    {"id": "hr", "name": "Human Resources"},
]

# Move the mock terms here
glossary_terms = {
    # Finance Domain
    "fin1": {
        "id": "fin1",
        "name": "Revenue",
        "description": "Income generated from normal business operations",
        "domain": "finance",
        "owner": "Finance Team",
        "status": "active",
        "created": "2024-01-01T00:00:00Z",
        "updated": "2024-01-15T00:00:00Z",
        "taggedAssets": [
            {
                "id": "1",
                "name": "monthly_revenue",
                "type": "table",
                "path": "finance.reporting.monthly_revenue"
            },
            {
                "id": "2",
                "name": "revenue_by_product",
                "type": "view",
                "path": "finance.analytics.revenue_by_product"
            }
        ]
    },
    "fin2": {
        "id": "fin2",
        "name": "Operating Expenses",
        "description": "Day-to-day costs of running the business",
        "domain": "finance",
        "owner": "Finance Team",
        "status": "active",
        "created": "2024-01-02T00:00:00Z",
        "updated": "2024-01-15T00:00:00Z",
        "taggedAssets": [
            {
                "id": "3",
                "name": "opex_summary",
                "type": "table",
                "path": "finance.reporting.operating_expenses"
            }
        ]
    },
    "fin3": {
        "id": "fin3",
        "name": "Gross Margin",
        "description": "Revenue minus cost of goods sold",
        "domain": "finance",
        "owner": "Finance Team",
        "status": "active",
        "created": "2024-01-03T00:00:00Z",
        "updated": "2024-01-15T00:00:00Z",
        "taggedAssets": []
    },
    "fin4": {
        "id": "fin4",
        "name": "Net Profit",
        "description": "Total revenue minus all expenses",
        "domain": "finance",
        "owner": "Finance Team",
        "status": "active",
        "created": "2024-01-04T00:00:00Z",
        "updated": "2024-01-15T00:00:00Z",
        "taggedAssets": []
    },
    "fin5": {
        "id": "fin5",
        "name": "Cash Flow",
        "description": "Net movement of cash and cash equivalents",
        "domain": "finance",
        "owner": "Finance Team",
        "status": "active",
        "created": "2024-01-05T00:00:00Z",
        "updated": "2024-01-15T00:00:00Z",
        "taggedAssets": []
    },
    "fin6": {
        "id": "fin6",
        "name": "Working Capital",
        "description": "Current assets minus current liabilities",
        "domain": "finance",
        "owner": "Finance Team",
        "status": "active",
        "created": "2024-01-21T00:00:00Z",
        "updated": "2024-01-21T00:00:00Z",
        "taggedAssets": [
            {
                "id": "4",
                "name": "working_capital_daily",
                "type": "table",
                "path": "finance.reporting.working_capital"
            }
        ]
    },
    "fin7": {
        "id": "fin7",
        "name": "Accounts Receivable",
        "description": "Money owed by customers for goods/services delivered",
        "domain": "finance",
        "owner": "Finance Team",
        "status": "active",
        "created": "2024-01-22T00:00:00Z",
        "updated": "2024-01-22T00:00:00Z",
        "taggedAssets": [
            {
                "id": "5",
                "name": "ar_aging",
                "type": "table",
                "path": "finance.accounting.accounts_receivable"
            },
            {
                "id": "6",
                "name": "ar_risk_analysis",
                "type": "view",
                "path": "finance.analytics.ar_risk"
            }
        ]
    },
    # Sales Domain Example
    "sales1": {
        "id": "sales1",
        "name": "Qualified Lead",
        "description": "Potential customer that meets defined criteria",
        "domain": "sales",
        "owner": "Sales Team",
        "status": "active",
        "created": "2024-01-06T00:00:00Z",
        "updated": "2024-01-15T00:00:00Z",
        "taggedAssets": [
            {
                "id": "20",
                "name": "qualified_leads",
                "type": "table",
                "path": "sales.crm.qualified_leads"
            },
            {
                "id": "21",
                "name": "lead_scoring",
                "type": "view",
                "path": "sales.analytics.lead_scoring"
            }
        ]
    },
    "sales2": {
        "id": "sales2",
        "name": "Opportunity",
        "description": "Qualified lead with potential deal value",
        "domain": "sales",
        "owner": "Sales Team",
        "status": "active",
        "created": "2024-01-07T00:00:00Z",
        "updated": "2024-01-15T00:00:00Z",
        "taggedAssets": []
    },
    "sales3": {
        "id": "sales3",
        "name": "Pipeline Value",
        "description": "Total value of all active opportunities",
        "domain": "sales",
        "owner": "Sales Team",
        "status": "active",
        "created": "2024-01-08T00:00:00Z",
        "updated": "2024-01-15T00:00:00Z",
        "taggedAssets": []
    },
    "sales4": {
        "id": "sales4",
        "name": "Win Rate",
        "description": "Percentage of opportunities won",
        "domain": "sales",
        "owner": "Sales Team",
        "status": "active",
        "created": "2024-01-09T00:00:00Z",
        "updated": "2024-01-15T00:00:00Z",
        "taggedAssets": []
    },
    "sales5": {
        "id": "sales5",
        "name": "Sales Cycle",
        "description": "Average time to close a deal",
        "domain": "sales",
        "owner": "Sales Team",
        "status": "active",
        "created": "2024-01-10T00:00:00Z",
        "updated": "2024-01-15T00:00:00Z",
        "taggedAssets": []
    },
    "sales6": {
        "id": "sales6",
        "name": "Customer Lifetime Value",
        "description": "Predicted total revenue from a customer relationship",
        "domain": "sales",
        "owner": "Sales Team",
        "status": "active",
        "created": "2024-01-23T00:00:00Z",
        "updated": "2024-01-23T00:00:00Z",
        "taggedAssets": [
            {
                "id": "22",
                "name": "customer_ltv",
                "type": "view",
                "path": "sales.analytics.customer_lifetime_value"
            }
        ]
    },
    "mkt1": {
        "id": "mkt1",
        "name": "Campaign",
        "description": "Organized marketing effort to promote products",
        "domain": "marketing",
        "owner": "Marketing Team",
        "status": "active",
        "created": "2024-01-11T00:00:00Z",
        "updated": "2024-01-15T00:00:00Z",
        "taggedAssets": []
    },
    "mkt2": {
        "id": "mkt2",
        "name": "Conversion Rate",
        "description": "Percentage of visitors taking desired action",
        "domain": "marketing",
        "owner": "Marketing Team",
        "status": "active",
        "created": "2024-01-12T00:00:00Z",
        "updated": "2024-01-15T00:00:00Z",
        "taggedAssets": []
    },
    "mkt3": {
        "id": "mkt3",
        "name": "Customer Segment",
        "description": "Group of customers sharing characteristics",
        "domain": "marketing",
        "owner": "Marketing Team",
        "status": "active",
        "created": "2024-01-13T00:00:00Z",
        "updated": "2024-01-15T00:00:00Z",
        "taggedAssets": []
    },
    "mkt4": {
        "id": "mkt4",
        "name": "Marketing ROI",
        "description": "Return on marketing investment",
        "domain": "marketing",
        "owner": "Marketing Team",
        "status": "active",
        "created": "2024-01-14T00:00:00Z",
        "updated": "2024-01-15T00:00:00Z",
        "taggedAssets": []
    },
    "mkt5": {
        "id": "mkt5",
        "name": "Brand Awareness",
        "description": "Level of consumer recognition of brand",
        "domain": "marketing",
        "owner": "Marketing Team",
        "status": "active",
        "created": "2024-01-15T00:00:00Z",
        "updated": "2024-01-15T00:00:00Z",
        "taggedAssets": []
    },
    "mkt6": {
        "id": "mkt6",
        "name": "Customer Acquisition Cost",
        "description": "Total cost to acquire a new customer",
        "domain": "marketing",
        "owner": "Marketing Team",
        "status": "active",
        "created": "2024-01-24T00:00:00Z",
        "updated": "2024-01-24T00:00:00Z",
        "taggedAssets": [
            {
                "id": "40",
                "name": "acquisition_costs",
                "type": "table",
                "path": "marketing.analytics.customer_acquisition"
            },
            {
                "id": "41",
                "name": "cac_by_channel",
                "type": "view",
                "path": "marketing.reporting.cac_channel_analysis"
            }
        ]
    },
    "hr1": {
        "id": "hr1",
        "name": "Employee Turnover",
        "description": "Rate at which employees leave organization",
        "domain": "hr",
        "owner": "HR Team",
        "status": "active",
        "created": "2024-01-16T00:00:00Z",
        "updated": "2024-01-16T00:00:00Z",
        "taggedAssets": []
    },
    "hr2": {
        "id": "hr2",
        "name": "Time to Hire",
        "description": "Average time to fill open position",
        "domain": "hr",
        "owner": "HR Team",
        "status": "active",
        "created": "2024-01-17T00:00:00Z",
        "updated": "2024-01-17T00:00:00Z",
        "taggedAssets": []
    },
    "hr3": {
        "id": "hr3",
        "name": "Employee Satisfaction",
        "description": "Measure of employee contentment",
        "domain": "hr",
        "owner": "HR Team",
        "status": "active",
        "created": "2024-01-18T00:00:00Z",
        "updated": "2024-01-18T00:00:00Z",
        "taggedAssets": []
    },
    "hr4": {
        "id": "hr4",
        "name": "Training Completion",
        "description": "Rate of completed mandatory training",
        "domain": "hr",
        "owner": "HR Team",
        "status": "active",
        "created": "2024-01-19T00:00:00Z",
        "updated": "2024-01-19T00:00:00Z",
        "taggedAssets": []
    },
    "hr5": {
        "id": "hr5",
        "name": "Compensation",
        "description": "Total employee remuneration package",
        "domain": "hr",
        "owner": "HR Team",
        "status": "active",
        "created": "2024-01-20T00:00:00Z",
        "updated": "2024-01-20T00:00:00Z",
        "taggedAssets": []
    },
    # Add more Finance terms
    "fin8": {
        "id": "fin8",
        "name": "Accounts Payable",
        "description": "Money owed to suppliers for goods/services received",
        "domain": "finance",
        "owner": "Finance Team",
        "status": "active",
        "created": "2024-01-25T00:00:00Z",
        "updated": "2024-01-25T00:00:00Z",
        "taggedAssets": [
            {
                "id": "7",
                "name": "ap_aging",
                "type": "table",
                "path": "finance.accounting.accounts_payable"
            }
        ]
    },
    "fin9": {
        "id": "fin9",
        "name": "Budget Variance",
        "description": "Difference between planned and actual spending",
        "domain": "finance",
        "owner": "Finance Team",
        "status": "active",
        "created": "2024-01-26T00:00:00Z",
        "updated": "2024-01-26T00:00:00Z",
        "taggedAssets": [
            {
                "id": "8",
                "name": "budget_variance",
                "type": "view",
                "path": "finance.reporting.budget_variance"
            },
            {
                "id": "9",
                "name": "department_budgets",
                "type": "table",
                "path": "finance.planning.department_budgets"
            }
        ]
    },
    # Add more Sales terms
    "sales7": {
        "id": "sales7",
        "name": "Sales Territory Coverage",
        "description": "Geographic distribution of sales representatives",
        "domain": "sales",
        "owner": "Sales Team",
        "status": "active",
        "created": "2024-01-27T00:00:00Z",
        "updated": "2024-01-27T00:00:00Z",
        "taggedAssets": [
            {
                "id": "23",
                "name": "territory_assignments",
                "type": "table",
                "path": "sales.operations.territory_assignments"
            }
        ]
    },
    "sales8": {
        "id": "sales8",
        "name": "Deal Size",
        "description": "Average value of closed deals",
        "domain": "sales",
        "owner": "Sales Team",
        "status": "active",
        "created": "2024-01-28T00:00:00Z",
        "updated": "2024-01-28T00:00:00Z",
        "taggedAssets": [
            {
                "id": "24",
                "name": "deal_metrics",
                "type": "view",
                "path": "sales.analytics.deal_metrics"
            }
        ]
    },
    # Add more Marketing terms
    "mkt7": {
        "id": "mkt7",
        "name": "Email Campaign Performance",
        "description": "Metrics for email marketing campaigns",
        "domain": "marketing",
        "owner": "Marketing Team",
        "status": "active",
        "created": "2024-01-29T00:00:00Z",
        "updated": "2024-01-29T00:00:00Z",
        "taggedAssets": [
            {
                "id": "42",
                "name": "email_metrics",
                "type": "table",
                "path": "marketing.campaigns.email_metrics"
            },
            {
                "id": "43",
                "name": "email_performance",
                "type": "view",
                "path": "marketing.analytics.email_performance"
            }
        ]
    },
    "mkt8": {
        "id": "mkt8",
        "name": "Social Media Engagement",
        "description": "Metrics for social media interaction",
        "domain": "marketing",
        "owner": "Marketing Team",
        "status": "active",
        "created": "2024-01-30T00:00:00Z",
        "updated": "2024-01-30T00:00:00Z",
        "taggedAssets": [
            {
                "id": "44",
                "name": "social_engagement",
                "type": "table",
                "path": "marketing.social.engagement_metrics"
            }
        ]
    },
    # Add more HR terms
    "hr6": {
        "id": "hr6",
        "name": "Performance Review",
        "description": "Employee performance evaluation process",
        "domain": "hr",
        "owner": "HR Team",
        "status": "active",
        "created": "2024-01-31T00:00:00Z",
        "updated": "2024-01-31T00:00:00Z",
        "taggedAssets": [
            {
                "id": "60",
                "name": "performance_reviews",
                "type": "table",
                "path": "hr.reviews.employee_performance"
            },
            {
                "id": "61",
                "name": "review_analytics",
                "type": "view",
                "path": "hr.analytics.performance_metrics"
            }
        ]
    },
    "hr7": {
        "id": "hr7",
        "name": "Recruitment Pipeline",
        "description": "Status of active job candidates",
        "domain": "hr",
        "owner": "HR Team",
        "status": "active",
        "created": "2024-02-01T00:00:00Z",
        "updated": "2024-02-01T00:00:00Z",
        "taggedAssets": [
            {
                "id": "62",
                "name": "recruitment_funnel",
                "type": "view",
                "path": "hr.recruiting.candidate_pipeline"
            }
        ]
    }
}

@bp.route('/api/glossary/domains', methods=['GET'])
def get_domains():
    """Get all business domains"""
    return jsonify(domains)

@bp.route('/api/glossary/terms', methods=['GET'])
def get_terms():
    """Get all glossary terms, optionally filtered by domain"""
    domain = request.args.get('domain')
    terms = list(glossary_terms.values())
    if domain:
        terms = [term for term in terms if term['domain'] == domain]
    return jsonify(terms)

@bp.route('/api/glossary/terms/<term_id>', methods=['GET'])
def get_term(term_id):
    """Get a specific glossary term"""
    if term_id not in glossary_terms:
        return jsonify({"error": "Term not found"}), 404
    return jsonify(glossary_terms[term_id])

@bp.route('/api/glossary/terms', methods=['POST'])
def create_term():
    """Create a new glossary term"""
    data = request.json
    term_id = str(uuid.uuid4())
    now = datetime.utcnow().isoformat() + 'Z'
    
    new_term = {
        "id": term_id,
        "name": data['name'],
        "description": data['description'],
        "domain": data['domain'],
        "owner": data['owner'],
        "status": data.get('status', 'draft'),
        "created": now,
        "updated": now,
        "taggedAssets": data.get('taggedAssets', [])
    }
    
    glossary_terms[term_id] = new_term
    return jsonify(new_term), 201

@bp.route('/api/glossary/terms/<term_id>', methods=['PUT'])
def update_term(term_id):
    """Update an existing glossary term"""
    if term_id not in glossary_terms:
        return jsonify({"error": "Term not found"}), 404
    
    data = request.json
    term = glossary_terms[term_id]
    
    term.update({
        "name": data['name'],
        "description": data['description'],
        "domain": data['domain'],
        "owner": data['owner'],
        "status": data['status'],
        "updated": datetime.utcnow().isoformat() + 'Z',
        "taggedAssets": data.get('taggedAssets', term['taggedAssets'])
    })
    
    return jsonify(term)

@bp.route('/api/glossary/terms/<term_id>', methods=['DELETE'])
def delete_term(term_id):
    """Delete a glossary term"""
    if term_id not in glossary_terms:
        return jsonify({"error": "Term not found"}), 404
    
    del glossary_terms[term_id]
    return '', 204

def register_routes(app):
    """Register routes with the app"""
    app.register_blueprint(bp) 