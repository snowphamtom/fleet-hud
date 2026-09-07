export type ProcessSnapshot = {
  stamp: string
  stampLabel: string
  ring: string
  drive: string
  mara: {
    role: string
    bot: string
    status: string
    rootFolders: number
    looseFiles: number
    looseFilesClaim: string
    rootTotalClaimed: string
    introOutroChildren: number
    shelves: string[]
    measured: string
    artifacts: string[]
  }
  cole: {
    role: string
    bot: string
    status: string
    proposeRows: number
    packA: number
    packB: number
    packC: number
    law: string
    artifacts: string[]
  }
  rina: {
    role: string
    bot: string
    status: string
    introOutroIntact: boolean
    introOutroId: string
    stayOptics: number
    propose07: number
    boundary: string
    artifacts: string[]
  }
  vince: {
    role: string
    bot: string
    status: string
    gate: string
    executed: { id: string; alias: string; dest: string; label: string }[]
    pending: { id: string; kind: string; target: string; why: string }[]
    artifacts: string[]
  }
  execute: {
    status: string
    when: string
    plates07: { moved: number; dest: string; fail: number }
    archival08: {
      moved: number
      dest: string
      fail: number
      breakdown: { named: number; img: number; uuid: number; misc: number }
    }
    totalMoves: number
    totalFail: number
    pendingGates: string[]
    artifacts: string[]
  }
  locks: string[]
  pendingHolds?: { id: string; kind: string; target: string; why: string }[]
}
