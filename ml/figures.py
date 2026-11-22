#!/usr/bin/env python3
"""Poster figures + a markdown results table from research/*.json and the bank."""
import json, os
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RES = os.path.join(ROOT, "research"); FIG = os.path.join(RES, "figures"); os.makedirs(FIG, exist_ok=True)
plt.rcParams.update({"figure.dpi": 130, "font.size": 10, "axes.spines.top": False, "axes.spines.right": False})
NAMES = {"random": "Random\n(no adaptivity)", "elo": "Elo\nadaptive", "elo_sr": "Elo + BKT +\nspaced rep.", "elo_sr_focus": "+ focus\nprotocol", "full": "+ ML model\n+ AI tutor"}
COL = {"random": "#8a94a6", "elo": "#7aa6e8", "elo_sr": "#2f7de1", "elo_sr_focus": "#16a37f", "full": "#7b4fe0"}

main = json.load(open(os.path.join(RES, "ablation.json")))
P = list(main["policies"].keys())

fig, axes = plt.subplots(1, 3, figsize=(13, 4))
ax = axes[0]
ax.bar(range(len(P)), [main["policies"][p]["gain"]["mean"] * 100 for p in P], yerr=[main["policies"][p]["gain"]["ci95"] * 100 for p in P], color=[COL[p] for p in P], capsize=4)
ax.set_xticks(range(len(P))); ax.set_xticklabels([NAMES[p] for p in P], fontsize=8); ax.set_ylabel("Learning gain (points, post − pre)"); ax.set_title("Learning gain (95% CI)", fontsize=10)
ax = axes[1]
ax.bar(range(len(P)), [main["policies"][p]["rapidRate"]["mean"] * 100 for p in P], yerr=[main["policies"][p]["rapidRate"]["ci95"] * 100 for p in P], color=[COL[p] for p in P], capsize=4)
ax.set_xticks(range(len(P))); ax.set_xticklabels([NAMES[p] for p in P], fontsize=8); ax.set_ylabel("Rapid guesses (% of answers)"); ax.set_title("Disengagement (rapid guessing)", fontsize=10)
ax = axes[2]
ax.bar(range(len(P)), [main["policies"][p]["accuracy"]["mean"] * 100 for p in P], color=[COL[p] for p in P])
ax.set_ylim(50, 75); ax.set_xticks(range(len(P))); ax.set_xticklabels([NAMES[p] for p in P], fontsize=8); ax.set_ylabel("Accuracy during practice (%)"); ax.set_title("Success rate while practising", fontsize=10)
fig.suptitle(f"Simulated study: {main['students']} virtual students × {main['days']} days × {main['sessionMinutes']} min (paired design)", fontsize=10)
fig.tight_layout(); fig.savefig(os.path.join(FIG, "ablation.png")); plt.close(fig)

scen = [("Narrow learning zone\n(σ=0.6)", "sens-zone0.6.json"), ("Main\n(σ=1.0)", "ablation.json"), ("Wide learning zone\n(σ=1.6)", "sens-zone1.6.json"), ("Stronger AI tutor\n(+0.35)", "sens-tutor0.35.json")]
fig, ax = plt.subplots(figsize=(11, 4)); w = 0.16; rows = []
for j, (lab, f) in enumerate(scen):
    path = os.path.join(RES, f)
    if not os.path.exists(path): continue
    r = json.load(open(path)); base = r["policies"]["random"]["gain"]["mean"]
    for i, p in enumerate(P):
        g = r["policies"][p]["gain"]; rel = (g["mean"] / base - 1) * 100
        ax.bar(j + (i - 2) * w, rel, w, color=COL[p], label=NAMES[p].replace("\n", " ") if j == 0 else None)
        rows.append((lab.replace("\n", " "), p, g["mean"] * 100, g["ci95"] * 100, rel))
ax.axhline(0, color="#999", lw=.8); ax.set_xticks(range(len(scen))); ax.set_xticklabels([s[0] for s in scen], fontsize=9)
ax.set_ylabel("Learning gain vs random (%)"); ax.set_title("Sensitivity analysis — does the ranking survive different assumptions?", fontsize=10); ax.legend(fontsize=8, frameon=False, ncol=5, loc="upper center", bbox_to_anchor=(.5, -.18))
fig.tight_layout(); fig.savefig(os.path.join(FIG, "sensitivity.png")); plt.close(fig)

bank = json.load(open(os.path.join(ROOT, "data", "questions.json")))
subs = ["math", "science", "english", "arabic"]; grades = list(range(7, 13))
cnt = {s: [sum(1 for q in bank if q["subject"] == s and q["gradeLevel"] == g) for g in grades] for s in subs}
fig, ax = plt.subplots(figsize=(7, 3.6)); bottom = [0] * 6
for s, c in zip(subs, ["#ffcf4a", "#a66bff", "#3dcf8f", "#3fb8ff"]):
    ax.bar(grades, cnt[s], bottom=bottom, color=c, label=s); bottom = [a + b for a, b in zip(bottom, cnt[s])]
ax.set_xlabel("Grade"); ax.set_ylabel("Questions"); ax.set_title(f"Question bank: {len(bank):,} validated questions", fontsize=10); ax.legend(frameon=False, fontsize=8)
fig.tight_layout(); fig.savefig(os.path.join(FIG, "bank.png")); plt.close(fig)

with open(os.path.join(RES, "RESULTS_TABLE.md"), "w") as f:
    f.write("| Scenario | Policy | Learning gain (pts) | ±95% CI | vs random |\n|---|---|---|---|---|\n")
    for lab, p, m, ci, rel in rows: f.write(f"| {lab} | {p} | {m:.2f} | {ci:.2f} | {rel:+.1f}% |\n")
print("figures → research/figures/{ablation,sensitivity,bank}.png ; table → research/RESULTS_TABLE.md")
