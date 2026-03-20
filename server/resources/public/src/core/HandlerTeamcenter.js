class HandlerTeamcenter {
  /**
   * baseUrl — опционально, если API располагается не в корне.
   * Пример: new HandlerTeamcenter('/api')
   */
  constructor(baseUrl = '') {
    this.baseUrl = baseUrl.replace(/\/$/, ''); // remove trailing slash
    this.currentUid = null;
    // Можно настроить default headers, timeout и т.д.
    this.defaultFetchOpts = {
      credentials: 'same-origin', // или 'include' если нужна куки + CORS
      cache: 'no-cache'
    };
  }

  _url(path) {
    if (!path) return this.baseUrl || '/';
    return this.baseUrl + path;
  }

  async getDataset(uid) {
    if (!uid) throw new Error('UID is required');
  
    const url = `${this._url('/getdataset')}?uid=${encodeURIComponent(uid)}`;
    const res = await fetch(url, {
      method: 'GET',
      ...this.defaultFetchOpts,
      headers: {
        'Accept': 'text/plain' // Получаем Base64
      }
    });
  
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`GET dataset failed: ${res.status} ${res.statusText} ${text}`);
    }
  
    const b64Text = await res.text();
    const binary = atob(b64Text);
    const bytes = Uint8Array.from(binary, c => c.charCodeAt(0));
    const xmlText = new TextDecoder().decode(bytes); // UTF-8 декодировка
    this.currentUid = uid;
    return xmlText;
  }

  async getDicts(uid) {
    if (!uid) throw new Error('UID is required');
  
    const url = `http://localhost:9090/getdataset?uid=${encodeURIComponent(uid)}`;
    const res = await fetch(url, {
      method: 'GET',
      ...this.defaultFetchOpts,
      headers: {
        'Accept': 'text/plain' // Получаем Base64
      }
    });
  
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`GET dataset failed: ${res.status} ${res.statusText} ${text}`);
    }
  
    const b64Text = await res.text();
    const binary = atob(b64Text);
    const bytes = Uint8Array.from(binary, c => c.charCodeAt(0));
    const xmlText = new TextDecoder().decode(bytes); // UTF-8 декодировка
    this.currentUid = uid;
    return xmlText;
  }


  async updateDataset(uid, xmlString) {
    if (!uid) throw new Error('UID is required');
    if (typeof xmlString !== 'string') throw new Error('xmlString must be a string');
  
    const url = `${this._url('/updatedataset')}?uid=${encodeURIComponent(uid)}`;
  
    // Кодируем XML-строку в Base64 UTF-8
    const encoder = new TextEncoder();
    const bytes = encoder.encode(xmlString);
    const binStr = Array.from(bytes).map(b => String.fromCodePoint(b)).join('');
    const b64Body = btoa(binStr);
  
    const res = await fetch(url, {
      method: 'POST',
      ...this.defaultFetchOpts,
      headers: {
        'Content-Type': 'text/plain', // Передаём Base64
        'Accept': 'text/plain'
      },
      body: b64Body
    });
  
    if (!res.ok) {
      const text = await res.text().catch(() => null);
      throw new Error(`POST update failed: ${res.status} ${res.statusText} ${text}`);
    }
  
    const resp = await res.text().catch(() => null);
    return resp;
  }
}

// экспорт для старого кода, чтобы подключить через <script>
// window.HandlerTeamcenter = window.HandlerTeamcenter || HandlerTeamcenter;