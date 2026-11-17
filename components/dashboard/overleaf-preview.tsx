"use client";

import { useState } from "react";
import {
  FileText,
  ExternalLink,
  RefreshCw,
  Smartphone,
  CheckCircle2,
  Users,
  Code2,
  ZoomIn,
  MessageSquareQuote,
  Sparkles,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";

interface OverleafPreviewProps {
  className?: string;
}

const SAMPLE_TEX_SOURCE = `% --------------------------------------------------------------
% EE301: Digital Signal Processing Laboratory Report
% Authors: Vatsal Shah, Renee Patel, Alex Chen
% --------------------------------------------------------------
\\documentclass[10pt,journal,compsoc]{IEEEtran}
\\usepackage{amsmath,amssymb,amsfonts}
\\usepackage{graphicx}
\\usepackage{booktabs}

\\begin{document}
\\title{Design, Frequency Response Analysis and Discretization of 4th-Order Butterworth IIR Filter}
\\author{Vatsal~Shah, Renee~Patel, and Alex~Chen}
\\maketitle

\\begin{abstract}
This report details the simulation, analog prototype synthesis,
and bilinear transform discretization of a 4th-order Butterworth bandpass
filter. The measured passband ripple remains within 0.2 dB with a 3 dB
bandwidth from 1.2 kHz to 4.8 kHz.
\\end{abstract}

\\section{Filter Transfer Function}
The s-domain transfer function of the prototype second-order section is:
\\begin{equation}
H(s) = \\frac{G_0 \\cdot \\omega_0^2}{s^2 + \\frac{\\omega_0}{Q}s + \\omega_0^2}
\\end{equation}
where Q = 4.25 and \\omega_0 = 2\\pi \\cdot 2400\\,\\text{rad/s}.

\\section{Experimental Measurements}
Measurements obtained via DSO agree with numerical simulation within 2.4\\% error.
\\end{document}`;

export function OverleafPreview({ className }: OverleafPreviewProps) {
  const [activeTab, setActiveTab] = useState<"compiled" | "source">("compiled");
  const [isCompiling, setIsCompiling] = useState(false);
  const [lastCompiled, setLastCompiled] = useState("3m ago");
  const [mobileModalOpen, setMobileModalOpen] = useState(false);
  const [reviewStatus, setReviewStatus] = useState<string | null>("Approved by Renee ✅");

  const handleRecompile = () => {
    setIsCompiling(true);
    setTimeout(() => {
      setIsCompiling(false);
      setLastCompiled("Just now");
      toast.success("Overleaf Project Recompiled! PDF updated to v2.4 (Latest).");
    }, 1200);
  };

  const handleAddReviewComment = (comment: string) => {
    setReviewStatus(comment);
    toast.success(`Review note added: "${comment}"`);
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <div>
            <div className="flex items-center gap-2">
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-500" />
                Overleaf / LaTeX Remote Preview
              </CardTitle>
              <Badge variant="outline" className="border-emerald-500/40 text-emerald-500 bg-emerald-500/10 text-[10px] py-0">
                Live Group Sync
              </Badge>
            </div>
            <CardDescription className="text-xs mt-0.5">
              Vatsal&apos;s Lab Report #4 • Compiled {lastCompiled} • Overleaf v2 Webhook
            </CardDescription>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs px-2 gap-1"
              onClick={handleRecompile}
              disabled={isCompiling}
            >
              <RefreshCw className={`w-3 h-3 ${isCompiling ? "animate-spin" : ""}`} />
              Recompile
            </Button>

            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs px-2 gap-1 text-primary border-primary/30"
              onClick={() => setMobileModalOpen(true)}
            >
              <Smartphone className="w-3 h-3" />
              Mobile Review
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs px-2 gap-1"
              asChild
            >
              <a
                href="https://www.overleaf.com"
                target="_blank"
                rel="noreferrer"
              >
                <ExternalLink className="w-3 h-3" />
                Overleaf
              </a>
            </Button>
          </div>
        </div>

        {/* Co-Authors Bar */}
        <div className="flex items-center justify-between pt-2 border-t text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-primary" />
            <span>
              <strong>Authors:</strong> Vatsal Shah (Lead), Renee Patel, Alex Chen
            </span>
          </div>
          {reviewStatus && (
            <Badge variant="secondary" className="text-[10px] py-0 px-2">
              {reviewStatus}
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
          <div className="flex justify-between items-center mb-2">
            <TabsList className="h-7">
              <TabsTrigger value="compiled" className="text-xs h-6 px-2.5">
                Compiled Document
              </TabsTrigger>
              <TabsTrigger value="source" className="text-xs h-6 px-2.5">
                <Code2 className="w-3 h-3 mr-1" />
                LaTeX Source
              </TabsTrigger>
            </TabsList>
            <span className="text-[11px] text-muted-foreground font-mono">
              EE301_DSP_Lab_Report_4.pdf
            </span>
          </div>

          {/* Compiled Document Render */}
          <TabsContent value="compiled" className="mt-0">
            <div className="border rounded-lg bg-card p-4 space-y-3 font-serif text-foreground shadow-inner max-h-[340px] overflow-y-auto">
              {/* Document Header */}
              <div className="text-center border-b pb-3 space-y-1">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-sans">
                  IEEE Transactions on Signal Processing • Student Laboratory Series
                </p>
                <h3 className="font-bold text-base leading-tight font-sans">
                  Design, Frequency Response Analysis and Discretization of 4th-Order Butterworth IIR Filter
                </h3>
                <p className="text-xs text-muted-foreground font-sans">
                  Vatsal Shah, Renee Patel, Alex Chen — Department of Electrical Engineering
                </p>
              </div>

              {/* Abstract */}
              <div className="bg-muted/40 p-2.5 rounded text-xs space-y-1 border">
                <strong className="font-sans text-[11px] uppercase tracking-wide text-primary">Abstract—</strong>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  This report details the simulation, analog prototype synthesis, and bilinear transform discretization of a 4th-order Butterworth bandpass filter. The measured passband ripple remains within 0.2 dB with a 3 dB bandwidth from 1.2 kHz to 4.8 kHz.
                </p>
              </div>

              {/* Equation Block */}
              <div className="space-y-1">
                <h4 className="font-bold text-xs font-sans text-foreground">I. S-Domain Transfer Function</h4>
                <div className="bg-accent/30 p-2.5 rounded text-center border font-mono text-xs overflow-x-auto text-primary">
                  H(s) = (G₀ · ω₀²) / (s² + (ω₀/Q)s + ω₀²), &nbsp; where Q = 4.25, ω₀ = 2π(2400 rad/s)
                </div>
              </div>

              {/* Experimental Data Table */}
              <div className="space-y-1">
                <h4 className="font-bold text-xs font-sans text-foreground">II. DSO Laboratory Measurements</h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border">
                    <thead className="bg-muted text-[11px] font-sans">
                      <tr>
                        <th className="p-1.5 border">Frequency (Hz)</th>
                        <th className="p-1.5 border">Theoretical (dB)</th>
                        <th className="p-1.5 border">Measured DSO (dB)</th>
                        <th className="p-1.5 border">Phase Shift (°)</th>
                      </tr>
                    </thead>
                    <tbody className="font-mono text-[11px]">
                      <tr className="border-t">
                        <td className="p-1.5 border">600</td>
                        <td className="p-1.5 border">-18.4</td>
                        <td className="p-1.5 border">-18.1</td>
                        <td className="p-1.5 border">+74°</td>
                      </tr>
                      <tr className="border-t bg-muted/20">
                        <td className="p-1.5 border font-semibold text-emerald-500">2,400 (Center)</td>
                        <td className="p-1.5 border">0.0</td>
                        <td className="p-1.5 border">-0.15</td>
                        <td className="p-1.5 border">0°</td>
                      </tr>
                      <tr className="border-t">
                        <td className="p-1.5 border">4,800 (-3dB)</td>
                        <td className="p-1.5 border">-3.01</td>
                        <td className="p-1.5 border">-3.10</td>
                        <td className="p-1.5 border">-46°</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Conclusion stamp */}
              <div className="pt-2 flex items-center justify-between text-[11px] text-muted-foreground font-sans">
                <span className="flex items-center gap-1 text-emerald-500 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  All 4 Bode plots verified & signed off
                </span>
                <span className="text-muted-foreground">Page 1 of 4</span>
              </div>
            </div>
          </TabsContent>

          {/* Source Code View */}
          <TabsContent value="source" className="mt-0">
            <pre className="bg-muted p-3 rounded-lg text-xs font-mono text-muted-foreground overflow-x-auto max-h-[340px]">
              <code>{SAMPLE_TEX_SOURCE}</code>
            </pre>
          </TabsContent>
        </Tabs>
      </CardContent>

      {/* Mobile Review Full-Screen Dialog */}
      <Dialog open={mobileModalOpen} onOpenChange={setMobileModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Smartphone className="w-5 h-5 text-primary" />
              Quick Mobile Review Mode (Vatsal & Team)
            </DialogTitle>
            <DialogDescription className="text-xs">
              Optimized compact preview for reviewing on the go between lectures.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <div className="p-3 rounded-lg bg-accent/40 border space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-primary">Lab Report #4 (DSP IIR Filter)</span>
                <Badge variant="outline" className="text-[10px]">v2.4 Compiled</Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                Passband ripple within 0.2 dB. All measurements cross-referenced with oscilloscope traces.
              </p>
            </div>

            <div className="space-y-1.5">
              <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                <MessageSquareQuote className="w-3.5 h-3.5 text-primary" />
                Quick Action Review Stamps:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs justify-start text-emerald-500 border-emerald-500/30 hover:border-emerald-500"
                  onClick={() => handleAddReviewComment("Approved to submit by Vatsal ✅")}
                >
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
                  Approve for Submission
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs justify-start text-amber-500 border-amber-500/30 hover:border-amber-500"
                  onClick={() => handleAddReviewComment("Review Section II Table 2 📝")}
                >
                  <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                  Request Minor Edits
                </Button>
              </div>
            </div>

            <div className="pt-2 border-t flex justify-between items-center">
              <span className="text-xs text-muted-foreground">Status: {reviewStatus}</span>
              <Button size="sm" onClick={() => setMobileModalOpen(false)}>
                Done Reviewing
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
