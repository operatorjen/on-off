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

  console.log('1. Testing Basic ASCII:')
  {
    const { db, location } = createTestDB()
    const protocol = new OnOff(db)
    try {
      await protocol.decodeSignal(72, 32, 1) // 'H '
      await protocol.decodeSignal(73, 33, 2) // 'I!'
      await protocol.decodeSignal(33, 10, 3) // '!\n'
      
      const message = await protocol.reconstructMessage(1, 3)
      const expected = 'H I!!\n'
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

  console.log('\n2. Testing Full Sentence:')
  {
    const { db, location } = createTestDB()
    const protocol = new OnOff(db)
    try {
      await protocol.decodeSignal(72, 69, 4) // 'HE'
      await protocol.decodeSignal(76, 76, 5) // 'LL' 
      await protocol.decodeSignal(79, 32, 6) // 'O '
      await protocol.decodeSignal(87, 79, 7) // 'WO'
      await protocol.decodeSignal(82, 76, 8) // 'RL'
      await protocol.decodeSignal(68, 0, 9) // 'D\0'
      
      const message = await protocol.reconstructMessage(4, 9)
      const expected = 'HELLO WORLD\0'
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

  console.log('\n3. Testing Special Characters:')
  {
    const { db, location } = createTestDB()
    const protocol = new OnOff(db)
    try {
      await protocol.decodeSignal(35, 36, 10) // '#$'
      await protocol.decodeSignal(37, 38, 11) // '%&'
      await protocol.decodeSignal(64, 42, 12) // '@*'
      
      const message = await protocol.reconstructMessage(10, 12)
      const expected = '#$%&@*'
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
      // 200 % 128 = 72 (H), 256 % 128 = 0
      await protocol.decodeSignal(200, 256, 13) // 'H\0'
      // 327 % 128 = 71 (G), 455 % 128 = 71 (G)
      await protocol.decodeSignal(327, 455, 14) // 'GG'
      
      const message = await protocol.reconstructMessage(13, 14)
      const expected = 'H\0GG'
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
      await protocol.decodeSignal(65, 66, 15) // 'AB'
      await protocol.decodeSignal(67, 68, 17) // 'CD'
      
      const message = await protocol.reconstructMessage(15, 17)
      const expected = 'AB  CD'
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
      await protocol.decodeSignal(65, 66, 18) // 'AB'
      await protocol.clear()
      
      const message = await protocol.reconstructMessage(18, 18)
      const expected = '  '
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