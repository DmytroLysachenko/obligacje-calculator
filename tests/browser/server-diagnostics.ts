const actionableServerError = /(?:\[auth\]\[error\]|UntrustedHost)/i;

export function findActionableServerDiagnostics(output: string) {
  return output
    .split(/\r?\n/)
    .filter((line) => actionableServerError.test(line))
    .slice(0, 20);
}
