import assert from 'assert'
import OnOff from '../index.mjs'

async function runTests() {
  let passed = 0
  let failed = 0

  console.log('Testing Basic Base3 to Base36 Conversion:')
  {
    const protocol = new OnOff()
    const base = 3
    try {
      await protocol.decodeSignal(base, 1, 0)
      await protocol.decodeSignal(base, 2, 1) 
      await protocol.decodeSignal(base, 1, 2)
      await protocol.decodeSignal(base, 2, 3)

      await protocol.decodeSignal(base, 1, 4)
      await protocol.decodeSignal(base, 2, 5)
      await protocol.decodeSignal(base, 1, 6)
      await protocol.decodeSignal(base, 3, 7)

      const message = await protocol.reconstructMessage(base, 0, 7)
      const expected = 'AB'
      assert.strictEqual(message, expected, `Expected "${expected}", got "${message}"`)
      console.log('   ✅ PASS')
      passed++
    } catch (error) {
      console.log(`   ❌ FAIL: ${error.message}`)
      failed++
    }
  }

  console.log('\nTesting Full Message Conversion Base3:')
  {
    const protocol = new OnOff()
    const base = 3
    try {
      await protocol.decodeSignal(base, 1, 0)
      await protocol.decodeSignal(base, 2, 1)
      await protocol.decodeSignal(base, 3, 2)
      await protocol.decodeSignal(base, 3, 3)

      await protocol.decodeSignal(base, 1, 4)
      await protocol.decodeSignal(base, 2, 5)
      await protocol.decodeSignal(base, 2, 6)
      await protocol.decodeSignal(base, 3, 7)

      await protocol.decodeSignal(base, 1, 8)
      await protocol.decodeSignal(base, 3, 9)
      await protocol.decodeSignal(base, 2, 10)
      await protocol.decodeSignal(base, 1, 11)

      await protocol.decodeSignal(base, 1, 12)
      await protocol.decodeSignal(base, 3, 13)
      await protocol.decodeSignal(base, 2, 14)
      await protocol.decodeSignal(base, 1, 15)

      await protocol.decodeSignal(base, 1, 16)
      await protocol.decodeSignal(base, 3, 17)
      await protocol.decodeSignal(base, 3, 18)
      await protocol.decodeSignal(base, 1, 19)

      const message = await protocol.reconstructMessage(base, 0, 19)
      const expected = 'HELLO'
      assert.strictEqual(message, expected, `Expected "${expected}", got "${message}"`)
      console.log('   ✅ PASS')
      passed++
    } catch (error) {
      console.log(`   ❌ FAIL: ${error.message}`)
      failed++
    }
  }

  console.log('\nTesting Full Message Conversion Base16:')
  {
    const protocol = new OnOff()
    const base = 16
    try {
      await protocol.decodeSignal(base, 2, 0)
      await protocol.decodeSignal(base, 2, 1)
      await protocol.decodeSignal(base, 2, 2)
      await protocol.decodeSignal(base, 3, 3)

      const message = await protocol.reconstructMessage(base, 0, 3)
      const expected = 'HI'
      assert.strictEqual(message, expected, `Expected "${expected}", got "${message}"`)
      console.log('   ✅ PASS')
      passed++
    } catch (error) {
      console.log(`   ❌ FAIL: ${error.message}`)
      failed++
    }
  }


  console.log('\nTesting Full Message Conversion Base36:')
  {
    const protocol = new OnOff()
    const base = 36
    try {
      await protocol.decodeSignal(base, 11, 0)
      await protocol.decodeSignal(base, 12, 1)
      await protocol.decodeSignal(base, 13, 2)
      await protocol.decodeSignal(base, 10, 4)
      
      const message = await protocol.reconstructMessage(base, 0, 4)
      const expected = 'ABC 9'
      assert.strictEqual(message, expected, `Expected "${expected}", got "${message}"`)
      console.log('   ✅ PASS')
      passed++
    } catch (error) {
      console.log(`   ❌ FAIL: ${error.message}`)
      failed++
    }
  }

  console.log('\nTesting Spaces for Zero Views:')
  {
    const protocol = new OnOff()
    const base = 3
    try {
      await protocol.decodeSignal(base, 1, 0)
      await protocol.decodeSignal(base, 0, 1)
      await protocol.decodeSignal(base, 1, 2)
      await protocol.decodeSignal(base, 1, 3)
      
      const message = await protocol.reconstructMessage(base, 0, 3)
      const expected = ' '
      assert.strictEqual(message, expected, `Expected "${expected}", got "${message}"`)
      console.log('   ✅ PASS')
      passed++
    } catch (error) {
      console.log(`   ❌ FAIL: ${error.message}`)
      failed++
    }
  }

  console.log('\nTesting Missing Hours Become Spaces:')
  {
    const protocol = new OnOff()
    const base = 3
    try {
      await protocol.decodeSignal(base, 1, 0)
      await protocol.decodeSignal(base, 2, 2) 

      const message = await protocol.reconstructMessage(base, 0, 3)
      const expected = ' '
      assert.strictEqual(message, expected, `Expected "${expected}", got "${message}"`)
      console.log('   ✅ PASS')
      passed++
    } catch (error) {
      console.log(`   ❌ FAIL: ${error.message}`)
      failed++
    }
  }

  console.log('\nTesting Clear Functionality:')
  {
    const protocol = new OnOff()
    const base = 3
    try {
      await protocol.decodeSignal(base, 1, 0)
      await protocol.decodeSignal(base, 1, 1)
      await protocol.clear()
      
      const message = await protocol.reconstructMessage(base, 0, 1)
      const expected = ' '
      assert.strictEqual(message, expected, `Expected "${expected}", got "${message}"`)
      console.log('   ✅ PASS')
      passed++
    } catch (error) {
      console.log(`   ❌ FAIL: ${error.message}`)
      failed++
    }
  }

  console.log('\n' + '='.repeat(50))
  console.log(`RESULTS: ${passed} passed, ${failed} failed`)
  console.log('='.repeat(50))

  return failed === 0
}

runTests().then(success => {
  process.exit(success ? 0 : 1)
}).catch(err => {
  console.error(err)
  process.exit(1)
})