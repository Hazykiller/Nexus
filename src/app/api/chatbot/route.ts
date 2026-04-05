import { NextRequest, NextResponse } from 'next/server';

// Cloud Serverless Computing - Edge handler for Syllabus requirement #13
const KNOWLEDGE_BASE: Record<string, string[]> = {
  cloud: [
    "Cloud computing provides on-demand IT resources over the internet.",
    "Using Vertex on Vercel is an example of PaaS (Platform as a Service).",
    "Neo4j AuraDB acts as our DBaaS (Database as a Service) component."
  ],
  vpc: [
    "A Virtual Private Cloud (VPC) creates an isolated virtual network.",
    "VPC allows configuring subnets, route tables, and security groups."
  ],
  security: [
    "Vertex implements AES-256-CBC at-rest encryption for sensitive PII.",
    "NACLs and Security Groups are fundamental cloud firewall components."
  ],
  container: [
    "Docker enables containerization, packaging code locally.",
    "Kubernetes provides orchestration to auto-scale those containers."
  ],
  hello: [
    "Hello there! I am the Vertex Cloud Assistant. How can I help you regarding Cloud Architecture, VPCs, Security, or Containers?"
  ],
  help: [
    "I am programmed to answer queries about our cloud syllabus. Ask me about: 'cloud', 'vpc', 'security', or 'container'."
  ]
};

export async function POST(req: NextRequest) {
  try {
    const { message } = await req.json();
    if (!message) return NextResponse.json({ error: 'No message provided' }, { status: 400 });

    const lowercaseMsg = String(message).toLowerCase();
    let responseText = "I'm a simple Cloud ChatBot! My knowledge covers cloud basics, vpc, security, and containerization. Ask me about those!";

    for (const [key, responses] of Object.entries(KNOWLEDGE_BASE)) {
      if (lowercaseMsg.includes(key)) {
        responseText = responses[Math.floor(Math.random() * responses.length)];
        break;
      }
    }

    // Simulate network delay to demonstrate asynchronous Edge function processing
    await new Promise((resolve) => setTimeout(resolve, 800 + Math.random() * 500));

    return NextResponse.json({ success: true, reply: responseText });
  } catch (error) {
    return NextResponse.json({ error: 'Serverless Edge Failure' }, { status: 500 });
  }
}
