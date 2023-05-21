FROM grafana/grafana:9.4.2

#Set work directory
WORKDIR /app

# Copy the package.json and package-lock.json files into the container
COPY package*.json ./

# Copy the node_modules folder into the container
COPY node_modules ./node_modules

# Copy the azure-api.js into the  container
COPY azure-api.js ./azure-api.js

# Copy the grafana-setup.js file into the container
COPY grafana-setup.js ./grafana-setup.js

# Install Node.js and npm
USER root
RUN apk add --update nodejs npm

# Set the entrypoint to run the script
ENTRYPOINT ["sh", "-c", "/run.sh & sleep 10 && node /app/grafana-setup.js && tail -f /dev/null"]
