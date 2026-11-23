/**
 * A tiny in-process SMTP server that accepts every message and keeps it in
 * memory, so tests can assert exactly what was emailed. No network access.
 */
import net from 'node:net';

export async function startSmtpSink() {
  const messages = [];
  const server = net.createServer((socket) => {
    let mode = 'cmd';
    let buf = '';
    let current = { from: '', to: [], data: '' };
    const reply = (line) => socket.write(`${line}\r\n`);
    reply('220 sink ready');
    socket.on('data', (chunk) => {
      buf += chunk.toString('utf8');
      let idx;
      while ((idx = buf.indexOf('\r\n')) !== -1) {
        const line = buf.slice(0, idx);
        buf = buf.slice(idx + 2);
        if (mode === 'data') {
          if (line === '.') {
            mode = 'cmd';
            messages.push(parse(current));
            current = { from: '', to: [], data: '' };
            reply('250 queued');
          } else current.data += (line.startsWith('..') ? line.slice(1) : line) + '\n';
          continue;
        }
        const cmd = line.slice(0, 4).toUpperCase();
        if (cmd === 'EHLO' || cmd === 'HELO') reply('250 sink');
        else if (cmd === 'MAIL') { current.from = line; reply('250 ok'); }
        else if (cmd === 'RCPT') { current.to.push(line.replace(/^RCPT TO:\s*/i, '').replace(/[<>]/g, '')); reply('250 ok'); }
        else if (cmd === 'DATA') { mode = 'data'; reply('354 go'); }
        else if (cmd === 'QUIT') { reply('221 bye'); socket.end(); }
        else reply('250 ok');
      }
    });
    socket.on('error', () => {});
  });
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  const { port } = server.address();
  return {
    port,
    messages,
    clear: () => messages.splice(0),
    /** Point the app's mailer at this sink. */
    use: () => {
      process.env.SMTP_HOST = '127.0.0.1';
      process.env.SMTP_PORT = String(port);
      process.env.SMTP_SECURE = 'false';
      process.env.SMTP_FROM = 'competition@test.local';
      delete process.env.SMTP_USER;
    },
    stop: () => new Promise((r) => server.close(r)),
  };
}

function decodeWords(v) {
  // RFC 2047 encoded-words (nodemailer encodes Bangla subjects, folded over several lines).
  return v.replace(/=\?utf-8\?([bq])\?([^?]*)\?=\s*/gi, (_, enc, text) =>
    enc.toLowerCase() === 'b'
      ? Buffer.from(text, 'base64').toString('utf8')
      : Buffer.from(text.replace(/_/g, ' ').replace(/=([0-9a-f]{2})/gi, (m, h) => String.fromCharCode(parseInt(h, 16))), 'latin1').toString('utf8')
  );
}

function decodeBody(raw) {
  // Decode every quoted-printable and base64 MIME part so tests can search plain text.
  const parts = raw.split(/\n--[^\n]+\n/);
  return parts
    .map((part) => {
      const [head, ...rest] = part.split(/\n\n/);
      const content = rest.join('\n\n');
      if (/content-transfer-encoding:\s*base64/i.test(head)) return Buffer.from(content.replace(/\s+/g, ''), 'base64').toString('utf8');
      if (/content-transfer-encoding:\s*quoted-printable/i.test(head)) {
        const bytes = content.replace(/=\n/g, '').replace(/=([0-9A-F]{2})/g, (m, h) => String.fromCharCode(parseInt(h, 16)));
        return Buffer.from(bytes, 'latin1').toString('utf8');
      }
      return content;
    })
    .join('\n');
}

function parse({ to, data }) {
  const [head] = data.split(/\n\n/);
  const unfolded = head.replace(/\n[ \t]+/g, ' ');
  const subjectLine = unfolded.split('\n').find((l) => /^subject:/i.test(l)) || '';
  return { to, subject: decodeWords(subjectLine.replace(/^subject:\s*/i, '')).trim(), raw: data, text: decodeBody(data) };
}
