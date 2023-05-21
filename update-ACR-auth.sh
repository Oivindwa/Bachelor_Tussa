#!/bin/bash
#Author: Øivind Wahlstrøm
#Date: 24.04.2023
#This script creates a Service principal that lets our application access ACR to pull images. 

#Checks if Azure CLI  is downloaded already, and of not downloads it. 
az -v | grep azure-cli

if [ $? -eq 0 ]; then
    echo "Azure CLI already installed"
    az -v | grep azure-cli
else
    echo "Azure CLI is not installed, will proceed to install"
    curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash
fi

#logs into azure 
az login

# Take user input for environment variables
read -p "Enter the name of your Azure Container Registry: " containerRegistry

#Outputs the Container registry name for verification 
echo $ACR_NAME

# Set ACR_NAME variable
ACR_NAME=$containerRegistry

#Logs out of ACR
docker logout $ACR_NAME

# Set SERVICE_PRINCIPAL_NAME to ACR_NAME plus _SP
SERVICE_PRINCIPAL_NAME="${ACR_NAME}_SP"

# Obtain the full registry ID of ACR
ACR_REGISTRY_ID=$(az acr show --name $ACR_NAME --query "id" --output tsv)

# Check if the service principal already exists
EXISTING_SP=$(az ad sp list --display-name $SERVICE_PRINCIPAL_NAME --query "[].appId" --output tsv)

#If so deletes it
if [ -n "$EXISTING_SP" ]; then
    echo "Service principal '$SERVICE_PRINCIPAL_NAME' already exists. Deleting it..."
    az ad sp delete --id $EXISTING_SP
    echo "Service principal deleted."
fi

# Create the service principal with rights scoped to the registry with only pull access (arcpull)
PASSWORD=$(az ad sp create-for-rbac --name $SERVICE_PRINCIPAL_NAME --scopes $ACR_REGISTRY_ID --role acrpull --query "password" --output tsv)
USER_NAME=$(az ad sp list --display-name $SERVICE_PRINCIPAL_NAME --query "[].appId" --output tsv)

echo "$PASSWORD" | docker login "$ACR_NAME.azurecr.io" -u $USER_NAME --password-stdin

#Puts service pinrcipal credentials in a json file 
echo '{
  "auths": {
    "testtussaacr.azurecr.io": {
      "username": "'$USER_NAME'",
      "password": "'$PASSWORD'"
    }
  }
}' > acr-auth.json

#Delete old secrets with SP credentials if they exist
if docker secret ls | grep -q acr-auth-config; then
    echo "Docker secret already exists. Removing it..."
    docker secret rm acr-auth-config
fi

#Create/ Update secret with credentials for the new SP
docker secret create acr-auth-config acr-auth.json

#Erace any trace of credentials in plane text 
rm acr-auth.json

#End of file message 
echo "Docker secret created."