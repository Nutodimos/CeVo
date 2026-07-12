import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getElectionBySlug } from "@/lib/election-context";
import { verifyAdminSession } from "@/lib/admin-auth";
import React from "react";
import { renderToStream } from "@react-pdf/renderer";
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

// PDF Styles
const styles = StyleSheet.create({
  page: { padding: 40, fontFamily: "Helvetica" },
  header: { marginBottom: 20, borderBottomWidth: 2, borderBottomColor: "#557C99", paddingBottom: 10 },
  title: { fontSize: 24, fontWeight: "bold", color: "#F26522", marginBottom: 5 },
  subtitle: { fontSize: 16, color: "#557C99", marginBottom: 5 },
  text: { fontSize: 10, color: "#333333", marginBottom: 3 },
  section: { marginTop: 15, marginBottom: 10 },
  positionTitle: { fontSize: 14, fontWeight: "bold", backgroundColor: "#f0f0f0", padding: 5, marginBottom: 5 },
  candidateRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 4, borderBottomWidth: 1, borderBottomColor: "#eeeeee" },
  candidateName: { fontSize: 12 },
  candidateVotes: { fontSize: 12, fontWeight: "bold" },
  winnerRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 4, borderBottomWidth: 1, borderBottomColor: "#eeeeee", backgroundColor: "#e6f7ef" },
  winnerName: { fontSize: 12, fontWeight: "bold", color: "#065f46" },
  winnerVotes: { fontSize: 12, fontWeight: "bold", color: "#065f46" },
  footer: { position: "absolute", bottom: 40, left: 40, right: 40, borderTopWidth: 1, borderTopColor: "#cccccc", paddingTop: 10 },
  footerText: { fontSize: 10, color: "#666666" },
  signatureLine: { marginTop: 30, borderTopWidth: 1, borderTopColor: "#000000", width: 200 },
  signatureText: { fontSize: 10, marginTop: 5 }
});

const ResultsPDF = ({ data }: { data: any }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <View style={styles.header}>
        <Text style={styles.title}>{data.electionName}</Text>
        <Text style={styles.subtitle}>Official Election Results</Text>
        <Text style={styles.text}>Opened: {data.openedAt}</Text>
        <Text style={styles.text}>Closed: {data.closedAt}</Text>
      </View>

      <View style={styles.section}>
        <Text style={{ fontSize: 12, fontWeight: "bold", marginBottom: 5 }}>Turnout Summary</Text>
        <Text style={styles.text}>
          {data.totalVoted} of {data.totalRegistered} registered voters participated ({Math.round((data.totalVoted / Math.max(1, data.totalRegistered)) * 100)}%)
        </Text>
      </View>

      {data.positions.map((pos: any, i: number) => (
        <View key={i} style={styles.section} wrap={false}>
          <Text style={styles.positionTitle}>{pos.title}</Text>
          {pos.candidates.map((c: any, j: number) => (
            <View key={j} style={c.isWinner ? styles.winnerRow : styles.candidateRow}>
              <Text style={c.isWinner ? styles.winnerName : styles.candidateName}>
                {c.name} {c.isWinner ? "(WINNER)" : ""}
              </Text>
              <Text style={c.isWinner ? styles.winnerVotes : styles.candidateVotes}>{c.votes}</Text>
            </View>
          ))}
        </View>
      ))}

      <View style={styles.footer} fixed>
        <Text style={styles.footerText}>Results certified on {new Date().toLocaleDateString()}</Text>
        <View style={styles.signatureLine} />
        <Text style={styles.signatureText}>Verified by:</Text>
      </View>
    </Page>
  </Document>
);

export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const admin = await verifyAdminSession();
  if (!admin) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const resolvedParams = await params;
  const slug = resolvedParams.slug;
  const format = req.nextUrl.searchParams.get("format");

  if (format !== "pdf" && format !== "csv") {
    return new NextResponse("Invalid format. Use ?format=pdf or ?format=csv", { status: 400 });
  }

  const election = await getElectionBySlug(slug);
  const config = await prisma.electionConfig.findUnique({ where: { electionId: election.id } });
  
  if (!config || !config.resultsPublished) {
    return new NextResponse("Results are not yet published.", { status: 403 });
  }

  // Fetch data
  const [totalRegistered, totalVoted] = await Promise.all([
    prisma.voterRoll.count({ where: { electionId: election.id } }),
    prisma.voterRoll.count({ where: { electionId: election.id, hasVoted: true } })
  ]);

  const positionsData = await prisma.position.findMany({
    where: { electionId: election.id },
    orderBy: { order: "asc" },
    include: {
      candidates: { orderBy: { order: "asc" } }
    }
  });

  const voteCounts = await prisma.vote.groupBy({
    by: ['candidateId'],
    _count: { candidateId: true },
    where: { electionId: election.id }
  });
  
  const countMap = Object.fromEntries(voteCounts.map(v => [v.candidateId, v._count.candidateId]));

  const positions = positionsData.map(p => {
    let maxVotes = -1;
    const candidates = p.candidates.map(c => {
      const votes = countMap[c.id] || 0;
      if (votes > maxVotes) maxVotes = votes;
      return { name: c.name, votes };
    });
    
    return {
      title: p.title,
      candidates: candidates.map(c => ({
        ...c,
        isWinner: c.votes > 0 && c.votes === maxVotes
      }))
    };
  });

  const formatDate = (d: Date) => d.toLocaleString();

  const data = {
    electionName: election.name,
    openedAt: config.opensAt ? formatDate(config.opensAt) : "N/A",
    closedAt: config.closesAt ? formatDate(config.closesAt) : "N/A",
    totalRegistered,
    totalVoted,
    positions
  };

  if (format === "csv") {
    let csv = "Position,Candidate,Votes,Winner\n";
    for (const pos of data.positions) {
      for (const cand of pos.candidates) {
        // Escape quotes
        const safePos = `"${pos.title.replace(/"/g, '""')}"`;
        const safeCand = `"${cand.name.replace(/"/g, '""')}"`;
        csv += `${safePos},${safeCand},${cand.votes},${cand.isWinner ? "Yes" : "No"}\n`;
      }
    }
    
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="${slug}-results.csv"`
      }
    });
  }

  if (format === "pdf") {
    try {
      const stream = await renderToStream(<ResultsPDF data={data} />);
      
      // Convert Node stream to Web ReadableStream
      const webStream = new ReadableStream({
        start(controller) {
          stream.on("data", (chunk) => controller.enqueue(chunk));
          stream.on("end", () => controller.close());
          stream.on("error", (err) => controller.error(err));
        }
      });

      return new NextResponse(webStream, {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="${slug}-results.pdf"`
        }
      });
    } catch (err) {
      console.error("PDF generation failed:", err);
      return new NextResponse("Failed to generate PDF", { status: 500 });
    }
  }

  return new NextResponse("Unknown format", { status: 400 });
}
