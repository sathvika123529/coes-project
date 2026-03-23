from http.server import HTTPServer, BaseHTTPRequestHandler
import json, re, math, random, time
from collections import Counter, defaultdict
from urllib.parse import urlparse

CORS = {"Access-Control-Allow-Origin":"*","Access-Control-Allow-Methods":"GET,POST,OPTIONS","Access-Control-Allow-Headers":"Content-Type"}
STOP = set(["a","about","above","after","all","am","an","and","any","are","as","at","be","because","been","before","being","below","between","both","but","by","cannot","could","did","do","does","doing","down","during","each","few","for","from","further","get","got","had","has","have","having","he","her","here","hers","herself","him","himself","his","how","if","in","into","is","it","its","itself","me","more","most","my","myself","no","nor","not","of","off","on","once","only","or","other","our","ours","ourselves","out","over","own","same","she","should","so","some","such","than","that","the","their","theirs","them","themselves","then","there","these","they","this","those","through","to","too","under","until","up","very","was","we","were","what","when","where","which","while","who","whom","why","will","with","would","you","your","yours","yourself","yourselves","also","may","shall","must","just","said","like","use","used","one","two","three","four","five","however","therefore","thus","hence","moreover","furthermore","nevertheless","whereas","whereby","thereby","herein"])

def preprocess(text):
    text = text.lower()
    text = re.sub(r'[^a-z\s]', ' ', text)
    return [t for t in text.split() if len(t) > 3 and t not in STOP]

def compute_tf(tokens):
    c = Counter(tokens)
    n = len(tokens)
    return {w: v/n for w, v in c.items()}

def compute_idf(docs):
    N = len(docs)
    df = defaultdict(int)
    for doc in docs:
        for w in set(doc):
            df[w] += 1
    return {w: math.log((N+1)/(f+1))+1 for w, f in df.items()}

def run_lda(docs, K, iters):
    all_w = set(w for d in docs for w in d)
    vocab = sorted(all_w)
    w2i = {w: i for i, w in enumerate(vocab)}
    V = len(vocab)
    D = len(docs)
    dids = [[w2i[w] for w in d if w in w2i] for d in docs]
    z = []
    dtc = [[0]*K for _ in range(D)]
    twc = [[0]*V for _ in range(K)]
    tc = [0]*K
    for d, doc in enumerate(dids):
        dz = []
        for w in doc:
            t = random.randint(0, K-1)
            dz.append(t)
            dtc[d][t] += 1
            twc[t][w] += 1
            tc[t] += 1
        z.append(dz)
    for _ in range(iters):
        for d, doc in enumerate(dids):
            for i, w in enumerate(doc):
                ot = z[d][i]
                dtc[d][ot] -= 1
                twc[ot][w] -= 1
                tc[ot] -= 1
                pr = [(dtc[d][k]+0.1)*(twc[k][w]+0.01)/(tc[k]+V*0.01) for k in range(K)]
                s = sum(pr)
                pr = [p/s for p in pr]
                nt = random.choices(range(K), weights=pr)[0]
                z[d][i] = nt
                dtc[d][nt] += 1
                twc[nt][w] += 1
                tc[nt] += 1
    twd = []
    dtd = []
    for k in range(K):
        tot = sum(twc[k]) + V*0.01
        twd.append([(twc[k][v]+0.01)/tot for v in range(V)])
    for d in range(D):
        tot = sum(dtc[d]) + K*0.1
        dtd.append([(dtc[d][k]+0.1)/tot for k in range(K)])
    top = []
    for k in range(K):
        wp = sorted(enumerate(twd[k]), key=lambda x: x[1], reverse=True)[:12]
        top.append([(vocab[v], p) for v, p in wp])
    return top, dtd

SAMPLE = "The government establishes comprehensive regulations governing environmental protection and sustainability initiatives across federal agencies. This policy framework mandates strict compliance with carbon emission reduction targets outlined in international climate agreements. Industrial entities must implement renewable energy solutions and adopt green infrastructure practices to minimize ecological impact. Economic development programs prioritize sustainable growth strategies balancing financial objectives with environmental stewardship. The department of finance allocates substantial budget resources toward climate adaptation measures and biodiversity conservation projects. Tax incentives provided to corporations demonstrating measurable progress toward sustainability benchmarks. Healthcare policy reforms require expanded access to medical services for underserved communities particularly in rural areas where healthcare infrastructure remains inadequate. The ministry of health oversees implementation of universal healthcare coverage programs designed to reduce disparities in health outcomes across socioeconomic groups. Mental health services receive increased funding and integration into primary care facilities nationwide. Education policy initiatives focus on modernizing curriculum standards to incorporate technology literacy critical thinking skills and civic responsibility. Schools receive dedicated funding for digital infrastructure improvements teacher professional development and student support services. Higher education institutions must demonstrate accountability through transparent reporting on student outcomes graduate employment rates and research contributions. National security strategies encompass cybersecurity defense capabilities border protection measures and international cooperation agreements. Intelligence agencies strengthen information sharing protocols with allied nations to combat terrorism organized crime and cyber warfare threats. Defense procurement policies require domestic manufacturing preferences and rigorous ethical oversight of weapons development programs. Trade and commerce regulations establish fair competition frameworks protecting domestic industries while promoting international market access. Import tariff structures reviewed periodically to ensure alignment with diplomatic objectives and economic partnership agreements. Small and medium enterprises benefit from streamlined regulatory processes and access to government procurement opportunities through supplier diversity programs."

class Handler(BaseHTTPRequestHandler):
    def log_message(self, f, *a):
        print(f"  {a[0]} {a[1]}")

    def send_json(self, data, status=200):
        body = json.dumps(data).encode()
        self.send_response(status)
        for k, v in CORS.items():
            self.send_header(k, v)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_OPTIONS(self):
        self.send_response(200)
        for k, v in CORS.items():
            self.send_header(k, v)
        self.end_headers()

    def do_GET(self):
        p = urlparse(self.path).path
        if p == "/api/health":
            self.send_json({"status": "ok"})
        elif p == "/api/sample":
            self.send_json({"text": SAMPLE, "filename": "sample_policy.txt"})
        else:
            self.send_json({"error": "not found"}, 404)

    def do_POST(self):
        p = urlparse(self.path).path
        n = int(self.headers.get("Content-Length", 0))
        raw = self.rfile.read(n)
        if p == "/api/analyze":
            try:
                b = json.loads(raw.decode())
                text = b.get("text", "")
                K = int(b.get("n_topics", 5))
                iters = int(b.get("n_iter", 30))
                name = b.get("doc_name", "doc")
                t0 = time.time()
                tokens = preprocess(text)
                if len(tokens) < 20:
                    self.send_json({"error": "Document too short"}, 400)
                    return
                cs = max(50, len(tokens)//5)
                chunks = [tokens[i:i+cs] for i in range(0, len(tokens), cs)]
                chunks = [c for c in chunks if len(c) >= 10]
                idf = compute_idf(chunks)
                tf = compute_tf(tokens)
                tfidf = sorted({w: tf[w]*idf.get(w,1) for w in tf}.items(), key=lambda x: x[1], reverse=True)
                top, dtd = run_lda(chunks, K, iters)
                labels = ["Topic: " + " / ".join(w for w, _ in tw[:3]).title() for tw in top]
                topics = []
                for k in range(K):
                    topics.append({
                        "id": k,
                        "label": labels[k],
                        "words": [{"word": w, "weight": round(p, 6)} for w, p in top[k]],
                        "doc_weights": [round(dtd[d][k], 4) for d in range(len(chunks))],
                        "dominant_docs": sum(1 for d in range(len(chunks)) if dtd[d].index(max(dtd[d])) == k)
                    })
                das = []
                for d in range(len(chunks)):
                    dom = dtd[d].index(max(dtd[d]))
                    das.append({
                        "chunk": d+1,
                        "dominant_topic": dom,
                        "topic_label": labels[dom],
                        "distribution": [round(dtd[d][k], 4) for k in range(K)]
                    })
                wf = Counter(tokens).most_common(25)
                self.send_json({
                    "model_id": f"m_{int(t0)}",
                    "document": {"name": name, "token_count": len(tokens), "vocab_size": len(set(tokens)), "chunks": len(chunks)},
                    "topics": topics,
                    "doc_assignments": das,
                    "top_tfidf_words": [{"word": w, "score": round(s, 6)} for w, s in tfidf[:20]],
                    "word_frequency": [{"word": w, "count": c} for w, c in wf],
                    "elapsed_seconds": round(time.time()-t0, 2),
                    "parameters": {"n_topics": K, "n_iter": iters}
                })
            except Exception as e:
                self.send_json({"error": str(e)}, 500)
        else:
            self.send_json({"error": "not found"}, 404)

if __name__ == "__main__":
    s = HTTPServer(("0.0.0.0", 8000), Handler)
    print("=" * 45)
    print("  Backend running at http://localhost:8000")
    print("  Zero dependencies - pure Python 3.14")
    print("  Press Ctrl+C to stop")
    print("=" * 45)
    try:
        s.serve_forever()
    except KeyboardInterrupt:
        print("\nStopped.")