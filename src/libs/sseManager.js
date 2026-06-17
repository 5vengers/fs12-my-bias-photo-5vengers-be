/**
 * SSE 연결 관리 싱글톤
 *
 * - 동일 유저의 다중 탭/디바이스 연결을 Map<userId, Set<res>> 구조로 관리합니다.
 * - 모듈 싱글톤이므로 별도 초기화 없이 import 후 바로 사용합니다.
 */
class SseManager {
  /** @type {Map<string, Set<import('express').Response>>} */
  #clients = new Map();

  /**
   * 유저의 SSE 연결을 등록합니다.
   * @param {string} userId
   * @param {import('express').Response} res
   */
  add(userId, res) {
    if (!this.#clients.has(userId)) {
      this.#clients.set(userId, new Set());
    }
    this.#clients.get(userId).add(res);
  }

  /**
   * 유저의 SSE 연결을 제거합니다.
   * 연결이 없는 유저 항목은 Map에서도 삭제해 메모리 누수를 방지합니다.
   * @param {string} userId
   * @param {import('express').Response} res
   */
  remove(userId, res) {
    const connections = this.#clients.get(userId);
    if (!connections) return;

    connections.delete(res);
    if (connections.size === 0) {
      this.#clients.delete(userId);
    }
  }

  /**
   * 특정 유저에게 SSE 이벤트를 전송합니다.
   * 전송 실패한(이미 끊긴) 연결은 자동으로 정리됩니다.
   *
   * @param {string} userId
   * @param {string} event  - SSE event name
   * @param {object} data   - JSON 직렬화 가능한 페이로드
   */
  send(userId, event, data) {
    const connections = this.#clients.get(userId);
    if (!connections?.size) return;

    const chunk = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;

    for (const res of connections) {
      try {
        res.write(chunk);
      } catch {
        this.remove(userId, res);
      }
    }
  }

  /** 전체 활성 연결 수 (로깅/모니터링 용도) */
  get connectionCount() {
    let total = 0;
    for (const set of this.#clients.values()) total += set.size;
    return total;
  }
}

export const sseManager = new SseManager();
