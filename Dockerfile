# (1) Build a deployable server with yarn
from node

COPY app/ /app
WORKDIR /app
RUN yarn install
RUN yarn template
RUN yarn build

# (2) Create a light weight server to host the result
from node

RUN yarn global add serve

COPY --from=0 /app/build /app
WORKDIR /app
CMD ["serve"]
