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
        'Accept': 'application/xml, text/xml, */*'
      }
    });
    if (!res.ok) {
      const text = await res.text().catch(()=>'');
      throw new Error(`GET dataset failed: ${res.status} ${res.statusText} ${text}`);
    }
    const xmlText = await res.text();
    this.currentUid = uid;
    return xmlText;
  }

  async updateDataset(uid, xmlString) {
    if (!uid) throw new Error('UID is required');
    if (typeof xmlString !== 'string') throw new Error('xmlString must be a string');
    const url = `${this._url('/updatedataset')}?uid=${encodeURIComponent(uid)}`;
    const res = await fetch(url, {
      method: 'POST',
      ...this.defaultFetchOpts,
      headers: {
        'Content-Type': 'application/xml',
        'Accept': 'text/plain, application/json, */*'
      },
      body: xmlString
    });
    if (!res.ok) {
      const text = await res.text().catch(()=>'');
      throw new Error(`POST update failed: ${res.status} ${res.statusText} ${text}`);
    }
    const text = await res.text().catch(()=>null);
    return text;
  }
}

// экспорт для старого кода, чтобы подключить через <script>
window.HandlerTeamcenter = window.HandlerTeamcenter || HandlerTeamcenter;