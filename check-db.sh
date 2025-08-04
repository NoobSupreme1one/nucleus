#\!/bin/bash
echo 'Checking RDS status...'
while true; do
    STATUS=$(aws rds describe-db-instances --db-instance-identifier nucleus-db --query 'DBInstances[0].DBInstanceStatus' --output text)
    ENDPOINT=$(aws rds describe-db-instances --db-instance-identifier nucleus-db --query 'DBInstances[0].Endpoint.Address' --output text)
    
    echo "$(date): Status = $STATUS"
    
    if [ "$STATUS" = "available" ]; then
        echo "✅ Database is ready\!"
        echo "Endpoint: $ENDPOINT"
        echo "DATABASE_URL=postgresql://nucleus:NucleusDB2024\!@$ENDPOINT:5432/nucleus"
        break
    fi
    
    sleep 30
done
