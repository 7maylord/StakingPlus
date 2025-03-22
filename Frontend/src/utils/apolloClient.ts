import { ApolloClient, InMemoryCache } from "@apollo/client";

const client = new ApolloClient({
  uri: import.meta.env.VITE_SUBGRAPH_URL, // Replace with your deployed subgraph URL
  cache: new InMemoryCache(),
});

export default client;