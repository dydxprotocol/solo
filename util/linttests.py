#!/usr/bin/env python

import sys
import string
import os
import glob
import copy

def lintDotOnly(dir, filepath):
    everythingOkay = True
    fileName = os.path.basename(filepath)
    allLines = open(filepath, 'r').readlines()
    for i in range(len(allLines)):
        line = allLines[i]
        if ".only(" in line:
            print ".only() found in " + fileName + ":" + str(i+1)
            everythingOkay = False

    return everythingOkay


def main():
    files = []
    start_dir = os.getcwd()
    pattern = "*.js"

    dir_path = os.path.dirname(os.path.dirname(os.path.realpath(__file__)))
    tests_path = dir_path + "/test"

    for dir, _, _ in os.walk(tests_path):
        files.extend(glob.glob(os.path.join(dir, pattern)))

    everythingOkay = True
    for file in files:
        everythingOkay &= lintDotOnly(dir_path, file)

    if everythingOkay:
        print "No test linting issues found."

    sys.exit(0 if everythingOkay else 1)


if __name__ == "__main__":
    main()
