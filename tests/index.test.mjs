import assert from 'assert'
import OnOff from '../index.mjs'

async function runTests() {
  let passed = 0
  let failed = 0

  console.log('Testing Basic Base3 to Base36 Conversion:')
  {
    const protocol = new OnOff()
    try {
      await protocol.decodeSignal(1, 0)
      await protocol.decodeSignal(1, 1) 
      await protocol.decodeSignal(1, 2)
      await protocol.decodeSignal(1, 3)
      
      await protocol.decodeSignal(1, 4)
      await protocol.decodeSignal(1, 5)
      await protocol.decodeSignal(1, 6)
      await protocol.decodeSignal(2, 7)
      
      const message = await protocol.reconstructMessage(0, 7)
      const expected = 'AB'
      assert.strictEqual(message, expected, `Expected "${expected}", got "${message}"`)
      console.log('   ✅ PASS')
      passed++
    } catch (error) {
      console.log(`   ❌ FAIL: ${error.message}`)
      failed++
    }
  }

  console.log('\nTesting Full Message Conversion:')
    {
      const protocol = new OnOff()
      try {
        await protocol.decodeSignal(1, 0)
        await protocol.decodeSignal(1, 1)
        await protocol.decodeSignal(3, 2)
        await protocol.decodeSignal(2, 3)

        await protocol.decodeSignal(1, 4)
        await protocol.decodeSignal(1, 5)
        await protocol.decodeSignal(2, 6)
        await protocol.decodeSignal(2, 7)

        await protocol.decodeSignal(1, 8)
        await protocol.decodeSignal(2, 9)
        await protocol.decodeSignal(1, 10)
        await protocol.decodeSignal(3, 11)

        await protocol.decodeSignal(1, 12)
        await protocol.decodeSignal(2, 13)
        await protocol.decodeSignal(1, 14)
        await protocol.decodeSignal(3, 15)
 
        await protocol.decodeSignal(1, 16)
        await protocol.decodeSignal(2, 17)
        await protocol.decodeSignal(2, 18)
        await protocol.decodeSignal(3, 19)
        
        const message = await protocol.reconstructMessage(0, 19)
        const expected = 'HELLO'
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
    try {
      await protocol.decodeSignal(1, 0)
      await protocol.decodeSignal(0, 1)
      await protocol.decodeSignal(1, 2)
      await protocol.decodeSignal(1, 3)
      
      const message = await protocol.reconstructMessage(0, 3)
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
    try {
      await protocol.decodeSignal(1, 0)
      await protocol.decodeSignal(2, 2) 

      const message = await protocol.reconstructMessage(0, 3)
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
    try {
      await protocol.decodeSignal(1, 0)
      await protocol.decodeSignal(1, 1)
      await protocol.clear()
      
      const message = await protocol.reconstructMessage(0, 1)
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