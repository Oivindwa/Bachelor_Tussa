#!/bin/bash
#Author: Øivind Wahlstrøm
#Date: 26.04.2023
#This script will rotate the secrets holding the SSL Certificates 
#This must be done after renewing the certificates every 90 days
#And before updateing the stack with the "docker stack deploy" command 


#Check if the Docker secret already exists
if docker secret inspect fullchain_pem > /dev/null 2>&1; then
    # Remove the existing Docker secret
    docker secret rm fullchain_pem
fi  

#Check if the Docker secret already exists
if docker secret inspect privkey_pem > /dev/null 2>&1; then
    # Remove the existing Docker secret
    docker secret rm privkey_pem
fi

#Creates secret with newly updated SSL certificates. 
docker secret create fullchain_pem /etc/letsencrypt/live/securityportal.tikt.no/fullchain.pem
docker secret create privkey_pem /etc/letsencrypt/live/securityportal.tikt.no/privkey.pem

#Redeploys the stack with new SSL certificates 
docker stack deploy --with-registry-auth -c stack.yml tussa-app
