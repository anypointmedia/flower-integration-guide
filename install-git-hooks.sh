#!/usr/bin/env bash
#
# install-git-hooks.sh — 저장소에 commit-msg hook을 활성화한다.
# 개발자가 클론 후 한 번 실행: ./install-git-hooks.sh
#
# 원리: 훅은 clone으로 따라오지 않으므로, .githooks/ 를 추적 파일로 두고
#       core.hooksPath 를 그쪽으로 지정해 팀이 공유한다.
# ---------------------------------------------------------------------------
set -euo pipefail

root=$(git rev-parse --show-toplevel 2>/dev/null) || {
  echo "git 저장소 안에서 실행하세요." >&2; exit 1
}

if [ ! -d "$root/.githooks" ]; then
  echo ".githooks 디렉터리가 없습니다. 템플릿이 저장소에 포함됐는지 확인하세요." >&2
  exit 1
fi

chmod +x "$root/.githooks/"* 2>/dev/null || true
git -C "$root" config core.hooksPath .githooks
echo "✓ core.hooksPath = .githooks 설정 완료 (commit-msg hook 활성화됨)"
