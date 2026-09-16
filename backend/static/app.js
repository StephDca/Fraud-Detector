

const THRESHOLD = 0.997; // cutoff from data/train.py

const TXNS = [
  { id: 'TXN-149382', t: 149382, clock: '01:29:42', amount: 1298.44, p: 0.9998 },
  { id: 'TXN-141156', t: 141156, clock: '23:12:36', amount: 412.90,  p: 0.9993 },
  { id: 'TXN-138904', t: 138904, clock: '22:35:04', amount: 89.99,   p: 0.9987 },
  { id: 'TXN-131720', t: 131720, clock: '20:35:20', amount: 2410.00, p: 0.9976 },
  { id: 'TXN-128455', t: 128455, clock: '19:40:55', amount: 15.50,   p: 0.9971 },
  { id: 'TXN-126011', t: 126011, clock: '19:00:11', amount: 764.20,  p: 0.9968 },
];

const DECISIONS = {
  approve: { label: 'Approved — legitimate', note: 'Payment released. Logged as a false alarm against the model.' },
  deny:    { label: 'Denied — confirmed fraud', note: 'Transaction blocked and the card frozen.' },
  flag:    { label: 'Flagged for investigation', note: 'Case sent to investigations with your note.' },
};

const pct = (p) => (p * 100).toFixed(2) + '%';
const money = (n) => '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const flagged = (p) => p >= THRESHOLD;
// the interesting range is 99–100%, so the meter zooms in on it
const meterPct = (p) => Math.max(0, Math.min(100, ((p - 0.99) / 0.01) * 100));

const state = { selected: 0, decisions: {}, noteOpen: false };

const $  = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

function renderQueue() {
  const host = $('[data-queue]');
  host.innerHTML = '';
  TXNS.forEach((t, i) => {
    const decision = state.decisions[t.id];
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'qitem';
    btn.dataset.flagged = String(flagged(t.p));
    btn.dataset.decided = String(Boolean(decision));
    btn.setAttribute('aria-current', String(i === state.selected));
    btn.innerHTML = `
      <span class="qitem-top">
        <span class="num qitem-prob">${pct(t.p)}</span>
        <span class="qitem-mid">
          <span class="num qitem-id">${t.id}</span>
          <span class="num qitem-time">Time ${t.t.toLocaleString('en-US')} s</span>
        </span>
        <span class="num qitem-amount">${money(t.amount)}</span>
      </span>
      <span class="qitem-bottom">
        <span class="tag ${flagged(t.p) ? 'tag-accent' : 'tag-outline'}">fraud = ${flagged(t.p)}</span>
        <span class="lbl qitem-status">${decision ? DECISIONS[decision.kind].label.split(' — ')[0] : 'Awaiting review'}</span>
      </span>`;
    btn.addEventListener('click', () => {
      state.selected = i;
      state.noteOpen = false;
      render();
    });
    host.appendChild(btn);
  });

  const open = TXNS.filter((t) => !state.decisions[t.id]).length;
  $('[data-open-count]').textContent = open + ' awaiting review';
}

function renderCase() {
  const txn = TXNS[state.selected];
  const decision = state.decisions[txn.id];
  const isFraud = flagged(txn.p);

  $('[data-case-id]').textContent = txn.id;
  $('[data-case-tag]').className = 'tag ' + (isFraud ? 'tag-accent' : 'tag-outline');
  $('[data-case-tag]').textContent = 'fraud = ' + isFraud;
  $('[data-case-status]').textContent = decision ? 'Closed' : 'Awaiting review';

  $('[data-hero]').dataset.flagged = String(isFraud);
  $('[data-prob]').textContent = pct(txn.p);
  $('[data-band]').textContent = isFraud ? 'ABOVE CUTOFF' : 'BELOW CUTOFF';
  $('[data-band-note]').textContent = isFraud
    ? '+' + ((txn.p - THRESHOLD) * 100).toFixed(2) + ' points over the ' + pct(THRESHOLD) + ' cutoff'
    : ((THRESHOLD - txn.p) * 100).toFixed(2) + ' points under the cutoff — flagged for context';
  $('[data-meter]').style.width = meterPct(txn.p).toFixed(1) + '%';

  $('[data-verdict]').textContent = isFraud ? 'TRUE' : 'FALSE';
  $('[data-amount]').textContent = money(txn.amount);
  $('[data-clock]').textContent = txn.clock;
  $('[data-elapsed]').textContent = 'T+' + txn.t.toLocaleString('en-US') + ' s since first txn';

  $('[data-pending]').hidden = Boolean(decision);
  $('[data-decided]').hidden = !decision;
  $('[data-note-box]').hidden = !state.noteOpen;

  if (decision) {
    const d = DECISIONS[decision.kind];
    $('[data-decision-label]').textContent = d.label;
    $('[data-decision-note]').textContent = decision.note ? d.note + ' Note: ' + decision.note : d.note;
  }
}

function render() {
  renderQueue();
  renderCase();
  $$('[data-threshold]').forEach((el) => { el.textContent = pct(THRESHOLD); });
}

function decide(kind, note = '') {
  state.decisions[TXNS[state.selected].id] = { kind, note };
  state.noteOpen = false;
  $('[data-note]').value = '';
  render();
}

document.addEventListener('click', (e) => {
  const act = e.target.closest('[data-act]');
  if (!act) return;
  const txn = TXNS[state.selected];

  switch (act.dataset.act) {
    case 'approve':
    case 'deny':
      decide(act.dataset.act);
      break;
    case 'flag': // a note is required before this leaves the reviewer
      state.noteOpen = true;
      render();
      $('[data-note]').focus();
      break;
    case 'cancel-flag':
      state.noteOpen = false;
      $('[data-note]').value = '';
      render();
      break;
    case 'submit-flag':
      decide('flag', $('[data-note]').value.trim());
      break;
    case 'undo':
      delete state.decisions[txn.id];
      render();
      break;
    case 'next': {
      const i = TXNS.findIndex((t, k) => k !== state.selected && !state.decisions[t.id]);
      if (i >= 0) { state.selected = i; render(); }
      break;
    }
  }
});

$('[data-note]').addEventListener('input', (e) => {
  $('[data-act="submit-flag"]').disabled = e.target.value.trim().length === 0;
});

$$('input[name="tab"]').forEach((radio) => {
  radio.addEventListener('change', () => {
    $$('[data-panel]').forEach((p) => { p.hidden = p.dataset.panel !== radio.value; });
  });
});

render();

async function loadTransactions(){
  const response = await fetch('/static/sample_transactions.json');
  const data = await response.json();
  const prediction = await Promise.all(data.map(async function scoreTransaction(transaction) {
      const result = await fetch('/predict', {method: 'POST',
      headers: {'Content-Type': 'application/json' },
      body: JSON.stringify(transaction)
      });
      const predictionResult = await result.json();
      return predictionResult; 
  }))
  console.log(prediction);
}

loadTransactions();
