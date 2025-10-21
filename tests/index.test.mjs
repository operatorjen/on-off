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
      await protocol.decodeSignal(0, 1) // 'A'
      await protocol.decodeSignal(1, 2) // 'B' 
      await protocol.decodeSignal(2, 3) // 'C'
      await protocol.decodeSignal(3, 4) // 'D'
      
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
      await protocol.decodeSignal(7, 10) // 'H'
      await protocol.decodeSignal(4, 11) // 'E'
      await protocol.decodeSignal(11, 12) // 'L'
      await protocol.decodeSignal(11, 13) // 'L'
      await protocol.decodeSignal(14, 14) // 'O'
      
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
      await protocol.decodeSignal(26, 15) // '0'
      await protocol.decodeSignal(27, 16) // '1'
      await protocol.decodeSignal(28, 17) // '2'
      await protocol.decodeSignal(29, 18) // '3'
      await protocol.decodeSignal(30, 19) // '4'
      
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
      // 36 % 36 = 0 -> 'A'
      await protocol.decodeSignal(36, 20) // 'A'
      // 37 % 36 = 1 -> 'B' 
      await protocol.decodeSignal(37, 21) // 'B'
      // 72 % 36 = 0 -> 'A'
      await protocol.decodeSignal(72, 22) // 'A'
      // 73 % 36 = 1 -> 'B'
      await protocol.decodeSignal(73, 23) // 'B'
      
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
      await protocol.decodeSignal(0, 15) // 'A'
      await protocol.decodeSignal(1, 17) // 'B'
      
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
      await protocol.decodeSignal(0, 18) // 'A'
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
      await protocol.decodeSignal(7, 0) // 7 % 36 = 7 -> 'H'
      await protocol.decodeSignal(43, 1) // 43 % 36 = 7 -> 'H'
      await protocol.decodeSignal(79, 2) // 79 % 36 = 7 -> 'H'
      await protocol.decodeSignal(115, 3) // 115 % 36 = 7 -> 'H'

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