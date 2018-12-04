#!/usr/bin/env python

import sys
import string
import os
import glob

# overwrite a single file, fixing the assert lines
def hideAsserts(dir, filepath):
    allLines = []
    numAssertsChanged = 0
    inAnAssert = False
    # parse entire file
    for line in open(filepath, 'r').readlines():
        builder = line.rstrip();
        assertToSkip = line.lstrip().startswith('assert(') and ('coverage-enable-line' not in line)
        explicitToSkip = 'coverage-disable-line' in line
        if assertToSkip or explicitToSkip:
            inAnAssert = True
            numAssertsChanged += 1
            spacesToAdd = len(builder) - len(builder.lstrip()) - 2;
            builder = ' ' * spacesToAdd + '/*' + builder.lstrip()

        indexOfEnd = builder.find(');')
        if (inAnAssert and indexOfEnd >= 0):
            inAnAssert = False
            loc = indexOfEnd + 2;
            builder = builder[:loc] + '*/' + builder[loc:]

        builder += '\n'
        allLines.append(builder)

    with open(filepath, 'w') as output:
        output.writelines(allLines)

    return numAssertsChanged

def main():
    files = []
    start_dir = os.getcwd()
    pattern   = "*.sol"

    dir_path = os.path.dirname(os.path.dirname(os.path.realpath(__file__)))

    for dir,_,_ in os.walk(dir_path+"/contracts"):
        files.extend(glob.glob(os.path.join(dir,pattern)))

    numHidden = 0
    for file in files:
        numHidden += hideAsserts(dir_path, file)

    print str(numHidden) + " asserts hidden."

    sys.exit(0)


if __name__ == "__main__":
    main()
