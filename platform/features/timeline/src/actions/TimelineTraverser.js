/*****************************************************************************
 * Open MCT Web, Copyright (c) 2009-2015, United States Government
 * as represented by the Administrator of the National Aeronautics and Space
 * Administration. All rights reserved.
 *
 * Open MCT Web is licensed under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * http://www.apache.org/licenses/LICENSE-2.0.
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations
 * under the License.
 *
 * Open MCT Web includes source code licensed under additional open source
 * licenses. See the Open Source Licenses file (LICENSES.md) included with
 * this source code distribution or the Licensing information page available
 * at runtime from the About dialog for additional information.
 *****************************************************************************/
/*global define,Promise*/

define([], function () {
    "use strict";

    /**
     * Builds a list of domain objects which should be included
     * in the CSV export of a given timeline.
     * @param {DomainObject} domainObject the object being exported
     * @constructor
     */
    function TimelineTraverser(domainObject) {
        this.domainObject = domainObject;
    }

    /**
     * Get a list of domain objects for CSV export.
     * @returns {Promise.<DomainObject[]>} a list of domain objects
     */
    TimelineTraverser.prototype.buildObjectList = function () {
        var idSet = {},
            objects = [];

        function addObject(domainObject) {
            var id = domainObject.getId(),
                subtasks = [];

            function addCompositionObjects() {
                return domainObject.useCapability('composition')
                    .then(function (childObjects) {
                        return Promise.all(childObjects.map(addObject));
                    });
            }

            function addRelationships() {
                var relationship = domainObject.getCapability('relationship');
                relationship.getRelatedObjects('modes')
                    .then(function (modeObjects) {
                        return Promise.all(modeObjects.map(addObject));
                    });
            }

            if (!idSet[id]) {
                idSet[id] = true;
                objects.push(domainObject);
                if (domainObject.hasCapability('composition')) {
                    subtasks.push(addCompositionObjects());
                }
                if (domainObject.hasCapability('relationship')) {
                    subtasks.push(addRelationships());
                }
            }

            return Promise.all(subtasks);
        }

        return addObject(this.domainObject).then(function () {
            return objects;
        });
    };

    return TimelineTraverser;

});