import { fileURLToPath } from 'url'
import { Level } from 'level'
import { rm } from 'fs/promises'
import assert from 'assert'
import OnOff from '../index.mjs'

function createTestDB() {
  const location = `./tests/db_test_${Date.now()}_${Math.random().toString(36).slice(2)}`
  const db = new Level(location, { valueEncoding: 'json' })
  return { db, location }
}

async function runTests() {
  let passed = 0
  let failed = 0

  console.log('1. Testing Basic Base36:')
  {
    const { db, location } = createTestDB()
    const protocol = new OnOff(db)
    try {
      await protocol.decodeSignal(1, 1) // 'A'
      await protocol.decodeSignal(2, 2) // 'B' 
      await protocol.decodeSignal(3, 3) // 'C'
      await protocol.decodeSignal(4, 4) // 'D'
      
      const message = await protocol.reconstructMessage(1, 4)
      const expected = 'ABCD'
      assert.strictEqual(message, expected, `Expected "${expected}", got "${message}"`)
      console.log('   ✅ PASS')
      passed++
    } catch (error) {
      console.log(`   ❌ FAIL: ${error.message}`)
      failed++
    } finally {
      await protocol.close()
      await rm(location, { recursive: true, force: true })
    }
  }

  console.log('\n2. Testing Full Message:')
  {
    const { db, location } = createTestDB()
    const protocol = new OnOff(db)
    try {
      await protocol.decodeSignal(8, 10) // 'H'
      await protocol.decodeSignal(5, 11) // 'E'
      await protocol.decodeSignal(12, 12) // 'L'
      await protocol.decodeSignal(12, 13) // 'L'
      await protocol.decodeSignal(15, 14) // 'O'
      
      const message = await protocol.reconstructMessage(10, 14)
      const expected = 'HELLO'
      assert.strictEqual(message, expected, `Expected "${expected}", got "${message}"`)
      console.log('   ✅ PASS')
      passed++
    } catch (error) {
      console.log(`   ❌ FAIL: ${error.message}`)
      failed++
    } finally {
      await protocol.close()
      await rm(location, { recursive: true, force: true })
    }
  }

  console.log('\n3. Testing Numbers:')
  {
    const { db, location } = createTestDB()
    const protocol = new OnOff(db)
    try {
      await protocol.decodeSignal(27, 15) // '0'
      await protocol.decodeSignal(28, 16) // '1'
      await protocol.decodeSignal(29, 17) // '2'
      await protocol.decodeSignal(30, 18) // '3'
      await protocol.decodeSignal(31, 19) // '4'
      
      const message = await protocol.reconstructMessage(15, 19)
      const expected = '01234'
      assert.strictEqual(message, expected, `Expected "${expected}", got "${message}"`)
      console.log('   ✅ PASS')
      passed++
    } catch (error) {
      console.log(`   ❌ FAIL: ${error.message}`)
      failed++
    } finally {
      await protocol.close()
      await rm(location, { recursive: true, force: true })
    }
  }

  console.log('\n4. Testing Modulo Wrapping:')
  {
    const { db, location } = createTestDB()
    const protocol = new OnOff(db)
    try {
      // 37 % 36 = 0 -> 'A'
      await protocol.decodeSignal(37, 20) // 'A'
      // 38 % 36 = 1 -> 'B' 
      await protocol.decodeSignal(38, 21) // 'B'
      // 73 % 36 = 0 -> 'A'
      await protocol.decodeSignal(73, 22) // 'A'
      // 74 % 36 = 1 -> 'B'
      await protocol.decodeSignal(74, 23) // 'B'
      
      const message = await protocol.reconstructMessage(20, 23)
      const expected = 'ABAB'
      assert.strictEqual(message, expected, `Expected "${expected}", got "${message}"`)
      console.log('   ✅ PASS')
      passed++
    } catch (error) {
      console.log(`   ❌ FAIL: ${error.message}`)
      failed++
    } finally {
      await protocol.close()
      await rm(location, { recursive: true, force: true })
    }
  }

  console.log('\n5. Testing Missing Hours:')
  {
    const { db, location } = createTestDB()
    const protocol = new OnOff(db)
    try {
      await protocol.decodeSignal(1, 15) // 'A'
      await protocol.decodeSignal(2, 17) // 'B'
      
      const message = await protocol.reconstructMessage(15, 17)
      const expected = 'A B' // hour 16 is missing -> space
      assert.strictEqual(message, expected, `Expected "${expected}", got "${message}"`)
      console.log('   ✅ PASS')
      passed++
    } catch (error) {
      console.log(`   ❌ FAIL: ${error.message}`)
      failed++
    } finally {
      await protocol.close()
      await rm(location, { recursive: true, force: true })
    }
  }

  console.log('\n6. Testing Clear Functionality:')
  {
    const { db, location } = createTestDB()
    const protocol = new OnOff(db)
    try {
      await protocol.decodeSignal(1, 18) // 'A'
      await protocol.clear()
      
      const message = await protocol.reconstructMessage(18, 18)
      const expected = ' ' // single space for single hour
      assert.strictEqual(message, expected, `Expected "${expected}", got "${message}"`)
      console.log('   ✅ PASS')
      passed++
    } catch (error) {
      console.log(`   ❌ FAIL: ${error.message}`)
      failed++
    } finally {
      await protocol.close()
      await rm(location, { recursive: true, force: true })
    }
  }

  console.log('\n7. Testing Natural Pattern Multipliers:')
  {
    const { db, location } = createTestDB()
    const protocol = new OnOff(db)
    try {
      await protocol.decodeSignal(8, 0) // 8 % 36 = 7 -> 'H'
      await protocol.decodeSignal(44, 1) // 44 % 36 = 7 -> 'H'
      await protocol.decodeSignal(80, 2) // 80 % 36 = 7 -> 'H'
      await protocol.decodeSignal(116, 3) // 116 % 36 = 7 -> 'H'

      const message = await protocol.reconstructMessage(0, 3)
      const expected = 'HHHH'
      assert.strictEqual(message, expected, `Expected "${expected}", got "${message}"`)
      console.log('   ✅ PASS')
      passed++
    } catch (error) {
      console.log(`   ❌ FAIL: ${error.message}`)
      failed++
    } finally {
      await protocol.close()
      await rm(location, { recursive: true, force: true })
    }
  }

  console.log('\n' + '='.repeat(50))
  console.log(`RESULTS: ${passed} passed, ${failed} failed`)
  console.log('='.repeat(50))

  return failed === 0
}

const isMain = (() => {
  const thisFile = fileURLToPath(import.meta.url)
  return process.argv[1] && process.argv[1] === thisFile
})()

if (isMain) {
  runTests().then(success => {
    process.exit(success ? 0 : 1)
  }).catch(err => {
    console.error(err)
    process.exit(1)
  })
}

export { runTests }