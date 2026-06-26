
// 서버가 준 inviteUrl/resultUrl은 배포 도메인 기준일 수 있어,
// 지금 앱이 떠 있는 주소(window.location.origin)로 링크를 다시 만듬

// 초대 링크 (팔로워가 접속해 참여하는 주소)
export function buildInviteUrl(inviteToken: string): string {
    return `${window.location.origin}/invite/${inviteToken}`;
}

// 결과 링크 (집계 결과를 보는 주소)
export function buildResultUrl(resultToken: string): string {
    return `${window.location.origin}/result/${resultToken}`;
}