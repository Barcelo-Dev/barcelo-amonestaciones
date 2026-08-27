export function printLetterText(text: string) {
  const el = document.getElementById('print-area');
  if (!el) return;
  el.innerHTML = '';
  const wrapper = document.createElement('div');
  wrapper.className = 'letter-paper';
  wrapper.textContent = text;
  el.appendChild(wrapper);
  window.print();
}

export async function downloadDocxFromText(text: string, filenameBase: string) {
  try {
    const res = await fetch('/api/letters/export-docx', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, filename: filenameBase }),
    });
    if (!res.ok) {
      let data: { error?: string } | null = null;
      try { data = await res.json(); } catch { /* noop */ }
      throw new Error(data?.error || 'No se pudo generar el Word.');
    }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filenameBase}.docx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (err) {
    alert(err instanceof Error ? err.message : 'No se pudo generar el Word.');
  }
}
