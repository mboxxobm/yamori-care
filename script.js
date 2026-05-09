const initialData = [
  {
    date: '2026-05-09',
    name: 'ソメちゃん',
    species: 'スミワケササクレヤモリ',
    crickets: 4,
    food: '',
    appetite: '通常',
    memo: ''
  },
  {
    date: '2026-05-09',
    name: 'フクちゃん',
    species: 'ニホンヤモリ',
    crickets: 2,
    food: '',
    appetite: '通常',
    memo: ''
  },
  {
    date: '2026-05-09',
    name: 'ココアちゃん',
    species: 'クレステッドゲッコー',
    crickets: 2,
    food: '',
    appetite: '食べず',
    memo: '食いつき悪い'
  },
  {
    date: '2026-05-09',
    name: 'オレンジ（みかんちゃん）',
    species: 'クレステッドゲッコー',
    crickets: 6,
    food: '',
    appetite: '食いつき普通',
    memo: ''
  },
  {
    date: '2026-05-09',
    name: 'メメちゃん',
    species: 'ニホンヤモリ（オス）',
    crickets: 0,
    food: 'コオロギフード',
    appetite: '少し',
    memo: ''
  }
];

if (!localStorage.getItem('yamoriRecords')) {
  localStorage.setItem('yamoriRecords', JSON.stringify(initialData));
}

const records = JSON.parse(localStorage.getItem('yamoriRecords'));
const tbody = document.getElementById('recordsBody');
const alerts = document.getElementById('alerts');
const chart = document.getElementById('chart');
const names = document.getElementById('names');

function render() {
  tbody.innerHTML = '';
  chart.innerHTML = '';
  alerts.innerHTML = '';

  const totals = {};

  records.forEach(r => {
    tbody.innerHTML += `
      <tr>
        <td>${r.date}</td>
        <td>${r.name}</td>
        <td>${r.species}</td>
        <td>${r.crickets}匹 ${r.food}</td>
        <td>${r.appetite}</td>
        <td>${r.memo}</td>
      </tr>`;

    totals[r.name] = (totals[r.name] || 0) + Number(r.crickets);

    if (['食べず', '食いつき悪い'].includes(r.appetite)) {
      alerts.innerHTML += `<p>⚠ ${r.name} は食欲低下の可能性</p>`;
    }
  });

  Object.entries(totals).forEach(([name, total]) => {
    const bar = document.createElement('div');
    bar.className = 'bar';
    bar.style.height = `${total * 20}px`;
    bar.innerHTML = `<span>${name}<br>${total}匹</span>`;
    chart.appendChild(bar);
  });

  const uniqueNames = [...new Set(records.map(r => r.name))];
  names.innerHTML = uniqueNames.map(n => `<option value="${n}">`).join('');
}

render();

document.getElementById('recordForm').addEventListener('submit', e => {
  e.preventDefault();

  const record = {
    date: date.value,
    name: name.value,
    species: species.value,
    crickets: Number(crickets.value),
    food: food.value,
    appetite: appetite.value,
    memo: memo.value
  };

  records.push(record);
  localStorage.setItem('yamoriRecords', JSON.stringify(records));
  render();
  e.target.reset();
});

document.getElementById('exportBtn').addEventListener('click', () => {
  const blob = new Blob([JSON.stringify(records, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'yamori-records.json';
  a.click();
});
